const { prisma } = require("../lib/prisma");
const { asyncHandler, AppError } = require("../utils/http");
const { slugify } = require("../utils/slugify");

const buildUniqueCourseSlug = async (title, ignoreCourseId) => {
  const base = slugify(title);
  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await prisma.course.findUnique({ where: { slug } });
    if (!existing || existing.id === ignoreCourseId) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
};

const buildUniqueLessonSlug = async (courseId, title, ignoreLessonId) => {
  const base = slugify(title);
  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await prisma.lesson.findFirst({
      where: { courseId, slug },
    });
    if (!existing || existing.id === ignoreLessonId) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
};

const listAdminCourses = asyncHandler(async (_req, res) => {
  const courses = await prisma.course.findMany({
    include: {
      lessons: {
        orderBy: { orderIndex: "asc" },
      },
      _count: {
        select: {
          lessons: true,
          orders: true,
          courseAccess: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, courses });
});

const createCourse = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  const slug = await buildUniqueCourseSlug(payload.title);

  const course = await prisma.course.create({
    data: {
      title: payload.title,
      slug,
      description: payload.description,
      shortDescription: payload.shortDescription,
      thumbnailUrl: payload.thumbnailUrl || null,
      priceInPaise: payload.priceInPaise,
      status: payload.status || "DRAFT",
    },
  });

  res.status(201).json({ success: true, course });
});

const updateCourse = asyncHandler(async (req, res) => {
  const existing = await prisma.course.findUnique({
    where: { id: req.params.courseId },
  });
  if (!existing) throw new AppError(404, "Course not found");

  const payload = req.validated.body;
  const slug =
    payload.title && payload.title !== existing.title
      ? await buildUniqueCourseSlug(payload.title, existing.id)
      : existing.slug;

  const course = await prisma.course.update({
    where: { id: existing.id },
    data: {
      title: payload.title,
      slug,
      description: payload.description,
      shortDescription: payload.shortDescription,
      thumbnailUrl: payload.thumbnailUrl || null,
      priceInPaise: payload.priceInPaise,
      status: payload.status || existing.status,
    },
  });

  res.json({ success: true, course });
});

const deleteCourse = asyncHandler(async (req, res) => {
  await prisma.course.delete({ where: { id: req.params.courseId } });
  res.json({ success: true, message: "Course deleted" });
});

const publishCourse = asyncHandler(async (req, res) => {
  const course = await prisma.course.update({
    where: { id: req.params.courseId },
    data: { status: req.body.status || "PUBLISHED" },
  });
  res.json({ success: true, course });
});

const createLesson = asyncHandler(async (req, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
  if (!course) throw new AppError(404, "Course not found");

  const payload = req.validated.body;
  const slug = await buildUniqueLessonSlug(course.id, payload.title);

  const lesson = await prisma.lesson.create({
    data: {
      courseId: course.id,
      title: payload.title,
      slug,
      description: payload.description,
      orderIndex: payload.orderIndex,
      durationSeconds: payload.durationSeconds,
      isPreview: payload.isPreview || false,
      bunnyVideoId: payload.bunnyVideoId || null,
      bunnyEmbedUrl: payload.bunnyEmbedUrl || null,
    },
  });

  res.status(201).json({ success: true, lesson });
});

const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId } });
  if (!lesson) throw new AppError(404, "Lesson not found");

  const payload = req.validated.body;
  const slug =
    payload.title && payload.title !== lesson.title
      ? await buildUniqueLessonSlug(lesson.courseId, payload.title, lesson.id)
      : lesson.slug;

  const updated = await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      title: payload.title,
      slug,
      description: payload.description,
      orderIndex: payload.orderIndex,
      durationSeconds: payload.durationSeconds,
      isPreview: payload.isPreview ?? lesson.isPreview,
      bunnyVideoId: payload.bunnyVideoId || null,
      bunnyEmbedUrl: payload.bunnyEmbedUrl || null,
    },
  });

  res.json({ success: true, lesson: updated });
});

const deleteLesson = asyncHandler(async (req, res) => {
  await prisma.lesson.delete({ where: { id: req.params.lessonId } });
  res.json({ success: true, message: "Lesson deleted" });
});

const listPayments = asyncHandler(async (_req, res) => {
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true, slug: true } },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, orders });
});

const listEnrolledUsers = asyncHandler(async (req, res) => {
  const where = req.query.courseId ? { courseId: req.query.courseId } : {};
  const enrollments = await prisma.userCourseAccess.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true, gradeLabel: true },
      },
      course: {
        select: { id: true, title: true, slug: true },
      },
    },
    orderBy: { grantedAt: "desc" },
  });

  res.json({ success: true, enrollments });
});

module.exports = {
  listAdminCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  createLesson,
  updateLesson,
  deleteLesson,
  listPayments,
  listEnrolledUsers,
};
