const { prisma } = require("../lib/prisma");
const { asyncHandler } = require("../utils/http");

const getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      gradeLabel: true,
      createdAt: true,
    },
  });

  res.json({ success: true, user });
});

const getEnrolledCourses = asyncHandler(async (req, res) => {
  const accessList = await prisma.userCourseAccess.findMany({
    where: { userId: req.user.id },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnailUrl: true,
          priceInPaise: true,
          status: true,
        },
      },
    },
    orderBy: { grantedAt: "desc" },
  });

  res.json({ success: true, enrollments: accessList });
});

const getPurchaseHistory = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: {
      course: {
        select: { id: true, title: true, slug: true, thumbnailUrl: true },
      },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, orders });
});

module.exports = { getProfile, getEnrolledCourses, getPurchaseHistory };
