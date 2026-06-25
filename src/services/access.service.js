const { prisma } = require("../lib/prisma");
const { env } = require("../config/env");

const userHasCourseAccess = async ({ userId, courseId }) => {
  const access = await prisma.userCourseAccess.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  if (!access) return false;
  if (access.expiresAt && access.expiresAt < new Date()) return false;
  return true;
};

const buildExpiresAt = () => {
  if (!env.courseAccessDays) return null; // 0 = perpetual
  const d = new Date();
  d.setDate(d.getDate() + env.courseAccessDays);
  return d;
};

const grantCourseAccess = async ({ userId, courseId, orderId, source = "PURCHASE", tx = prisma }) => {
  const expiresAt = buildExpiresAt();
  return tx.userCourseAccess.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {
      orderId,
      source,
      grantedAt: new Date(),
      expiresAt,
    },
    create: {
      userId,
      courseId,
      orderId,
      source,
      expiresAt,
    },
  });
};

module.exports = { userHasCourseAccess, grantCourseAccess };
