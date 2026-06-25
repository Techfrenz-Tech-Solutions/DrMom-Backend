const { z } = require("zod");

const createOrderSchema = z.object({
  params: z.object({}).optional(),
  query: z.object({}).optional(),
  body: z.object({
    courseId: z.string().min(1),
  }),
});

const verifyPaymentSchema = z.object({
  params: z.object({}).optional(),
  query: z.object({}).optional(),
  body: z.object({
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
  }),
});

module.exports = { createOrderSchema, verifyPaymentSchema };
