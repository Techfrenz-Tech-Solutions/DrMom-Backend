const { prisma } = require("../lib/prisma");

const userHasCourseAccess = async ({ userId, courseId }) => {
  const access = await prisma.userCourseAccess.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  if (!access) return false;
  if (access.expiresAt && access.expiresAt < new Date()) return false;
  return true;
};

const grantCourseAccess = async ({ userId, courseId, orderId, source = "PURCHASE", tx = prisma }) =>
  tx.userCourseAccess.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {
      orderId,
      source,
      grantedAt: new Date(),
    },
    create: {
      userId,
      courseId,
      orderId,
      source,
    },
  });

module.exports = { userHasCourseAccess, grantCourseAccess };
