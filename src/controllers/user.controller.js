const { prisma } = require("../lib/prisma");
const { asyncHandler, AppError } = require("../utils/http");

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

const getProgress = asyncHandler(async (req, res) => {
  const progress = await prisma.videoProgress.findMany({
    where: { userId: req.user.id },
    select: {
      lessonId: true,
      watchedSeconds: true,
      completed: true,
      lastWatchedAt: true,
    },
    orderBy: { lastWatchedAt: "desc" },
  });

  res.json({ success: true, progress });
});

const upsertProgress = asyncHandler(async (req, res) => {
  const { lessonId, watchedSeconds, completed } = req.body;
  // lessonId is validated by Zod schema in user.routes.js

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new AppError(404, "Lesson not found");

  // Enforce purchase gate — only preview lessons are free to track
  if (!lesson.isPreview) {
    const { userHasCourseAccess } = require("../services/access.service");
    const hasAccess = await userHasCourseAccess({ userId: req.user.id, courseId: lesson.courseId });
    if (!hasAccess) throw new AppError(403, "Purchase required to track this lesson");
  }

  const progress = await prisma.videoProgress.upsert({
    where: { userId_lessonId: { userId: req.user.id, lessonId } },
    create: {
      userId: req.user.id,
      lessonId,
      watchedSeconds: watchedSeconds || 0,
      completed: completed || false,
      lastWatchedAt: new Date(),
    },
    update: {
      watchedSeconds: watchedSeconds ?? undefined,
      completed: completed ?? undefined,
      lastWatchedAt: new Date(),
    },
  });

  res.json({ success: true, progress });
});

module.exports = { getProfile, getEnrolledCourses, getPurchaseHistory, getProgress, upsertProgress };
