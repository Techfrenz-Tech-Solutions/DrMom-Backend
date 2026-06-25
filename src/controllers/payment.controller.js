const crypto = require("crypto");
const { prisma } = require("../lib/prisma");
const { env } = require("../config/env");
const {
  razorpayClient,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} = require("../utils/razorpay");
const { asyncHandler, AppError } = require("../utils/http");
const { grantCourseAccess } = require("../services/access.service");

const createPaymentOrder = asyncHandler(async (req, res) => {
  if (!razorpayClient) {
    throw new AppError(503, "Razorpay is not configured");
  }

  const course = await prisma.course.findUnique({
    where: { id: req.validated.body.courseId },
  });

  if (!course || course.status !== "PUBLISHED") {
    throw new AppError(404, "Course not found");
  }

  const existingAccess = await prisma.userCourseAccess.findUnique({
    where: { userId_courseId: { userId: req.user.id, courseId: course.id } },
  });
  if (existingAccess && (!existingAccess.expiresAt || existingAccess.expiresAt > new Date())) {
    throw new AppError(409, "Course already purchased");
  }

  const receipt = `receipt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const razorpayOrder = await razorpayClient.orders.create({
    amount: course.priceInPaise,
    currency: "INR",
    receipt,
    notes: {
      courseId: course.id,
      userId: req.user.id,
    },
  });

  const order = await prisma.order.create({
    data: {
      userId: req.user.id,
      courseId: course.id,
      razorpayOrderId: razorpayOrder.id,
      amountInPaise: course.priceInPaise,
      currency: "INR",
      receipt,
      status: "CREATED",
      notesJson: razorpayOrder.notes,
    },
  });

  res.status(201).json({
    success: true,
    order: {
      id: order.id,
      razorpayOrderId: order.razorpayOrderId,
      amountInPaise: order.amountInPaise,
      currency: order.currency,
      course: {
        id: course.id,
        title: course.title,
        slug: course.slug,
      },
      razorpayKeyId: env.razorpayKeyId,
    },
  });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.validated.body;
  const isValid = verifyRazorpayPaymentSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!isValid) {
    throw new AppError(400, "Invalid Razorpay signature");
  }

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { razorpayOrderId },
      include: { course: true },
    });

    if (!order) throw new AppError(404, "Order not found");
    if (order.userId !== req.user.id) throw new AppError(403, "Forbidden");

    await tx.order.update({
      where: { id: order.id },
      data: {
        razorpayPaymentId,
        status: "PAID",
      },
    });

    await tx.payment.upsert({
      where: { razorpayPaymentId },
      update: {
        razorpaySignature,
        status: "VERIFIED",
      },
      create: {
        orderId: order.id,
        razorpayPaymentId,
        razorpaySignature,
        amountInPaise: order.amountInPaise,
        currency: order.currency,
        status: "VERIFIED",
      },
    });

    await grantCourseAccess({
      userId: order.userId,
      courseId: order.courseId,
      orderId: order.id,
      tx,
    });

    return order;
  });

  res.json({
    success: true,
    message: "Payment verified and course access granted",
    orderId: result.id,
    courseId: result.courseId,
  });
});

const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const rawBody = req.rawBody;
  const isValid = verifyRazorpayWebhookSignature({ rawBody, signature });

  if (!isValid) {
    throw new AppError(400, "Invalid webhook signature");
  }

  const event = req.body;

  if (event.event === "payment.captured") {
    const entity = event.payload?.payment?.entity;
    const razorpayOrderId = entity?.order_id;
    const razorpayPaymentId = entity?.id;

    if (razorpayOrderId && razorpayPaymentId) {
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { razorpayOrderId } });
        if (!order) return;

        await tx.order.update({
          where: { id: order.id },
          data: { status: "PAID", razorpayPaymentId },
        });

        await tx.payment.upsert({
          where: { razorpayPaymentId },
          update: {
            status: "VERIFIED",
            razorpayWebhookEventId: event.id,
            payloadJson: event,
          },
          create: {
            orderId: order.id,
            razorpayPaymentId,
            razorpayWebhookEventId: event.id,
            amountInPaise: order.amountInPaise,
            currency: order.currency,
            method: entity.method || null,
            status: "VERIFIED",
            payloadJson: event,
          },
        });

        await grantCourseAccess({
          userId: order.userId,
          courseId: order.courseId,
          orderId: order.id,
          tx,
        });
      });
    }
  }

  if (event.event === "payment.failed") {
    const entity = event.payload?.payment?.entity;
    const razorpayOrderId = entity?.order_id;

    if (razorpayOrderId) {
      await prisma.order.updateMany({
        where: { razorpayOrderId, status: "CREATED" },
        data: { status: "FAILED" },
      });
    }
  }

  res.json({ success: true, received: true });
});

module.exports = { createPaymentOrder, verifyPayment, handleWebhook };
