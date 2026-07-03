const bcrypt = require("bcryptjs");
const { prisma } = require("../lib/prisma");
const { asyncHandler, AppError } = require("../utils/http");
const { slugify } = require("../utils/slugify");
const { signStorageUrl } = require("../utils/bunnyStorage");

const selectUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  gradeLabel: true,
  isActive: true,
  createdAt: true,
  courseAccess: {
    include: {
      course: { select: { id: true, title: true, classLabel: true, subject: true } },
    },
    orderBy: { grantedAt: "desc" },
  },
  orders: {
    orderBy: { createdAt: "desc" },
    take: 1,
    include: { course: { select: { title: true } } },
  },
};

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

// Chapters.jsx reads the quiz back as `assessments`; the DB column is
// `assessmentsJson` (Prisma Json). Alias it on the way out.
// pdfStoragePath (internal Bunny path, never public) is aliased back to the
// `pdfUrl` field name Chapters.jsx already expects — the value is an opaque
// storage reference, not a clickable link. `pdfPreviewUrl` is a separate,
// short-lived signed URL admins can optionally use to preview the file.
const serializeChapter = (chapter) => {
  const { pdfStoragePath, assessmentsJson, ...rest } = chapter;
  return {
    ...rest,
    pdfUrl: pdfStoragePath || null,
    pdfPreviewUrl: pdfStoragePath ? signStorageUrl(pdfStoragePath, 300) : null,
    assessments: assessmentsJson || [],
  };
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

const listAdminCatalog = asyncHandler(async (_req, res) => {
  const [classes, subjects, chapters, courses] = await Promise.all([
    prisma.classLevel.findMany({ orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }] }),
    prisma.subject.findMany({ orderBy: [{ classLabel: "asc" }, { name: "asc" }] }),
    prisma.chapter.findMany({
      include: { course: { select: { id: true, title: true } } },
      orderBy: [{ orderIndex: "asc" }, { createdAt: "asc" }],
    }),
    prisma.course.findMany({
      include: { lessons: { orderBy: { orderIndex: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  res.json({ success: true, classes, subjects, chapters: chapters.map(serializeChapter), courses });
});

const getDashboard = asyncHandler(async (_req, res) => {
  const [userCount, activeUserCount, classCount, subjectCount, chapterCount, lessonCount, freeLessonCount, orders, users, courses] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.classLevel.count(),
      prisma.subject.count(),
      prisma.chapter.count(),
      prisma.lesson.count(),
      prisma.lesson.count({ where: { isPreview: true } }),
      prisma.order.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, gradeLabel: true, isActive: true } },
          course: { select: { id: true, title: true, classLabel: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.user.findMany({ select: selectUser, orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.course.findMany({
        include: { lessons: { orderBy: { createdAt: "desc" }, take: 5 } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const lessons = courses.flatMap((course) =>
    course.lessons.map((lesson) => ({
      ...lesson,
      courseTitle: course.title,
      classLabel: course.classLabel,
      subject: course.subject,
    })),
  ).slice(0, 5);

  res.json({
    success: true,
    stats: {
      users: userCount,
      activeUsers: activeUserCount,
      classes: classCount,
      subjects: subjectCount,
      chapters: chapterCount,
      lessons: lessonCount,
      pricingPlans: courses.length,
      freeLessons: freeLessonCount,
      orders: orders.length,
    },
    recentUsers: users,
    recentLessons: lessons,
    recentOrders: orders,
  });
});

const createCourse = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  const slug = await buildUniqueCourseSlug(payload.title);

  const course = await prisma.course.create({
    data: {
      code: payload.code || null,
      title: payload.title,
      slug,
      description: payload.description,
      shortDescription: payload.shortDescription,
      thumbnailUrl: payload.thumbnailUrl || null,
      priceInPaise: payload.priceInPaise,
      status: payload.status || "DRAFT",
      classId: payload.classId || null,
      classLabel: payload.classLabel || null,
      subject: payload.subject || null,
      color: payload.color || null,
      emoji: payload.emoji || null,
      tagline: payload.tagline || null,
      studentsLabel: payload.studentsLabel || null,
      featuresJson: payload.features || [],
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
      code: payload.code || null,
      title: payload.title,
      slug,
      description: payload.description,
      shortDescription: payload.shortDescription,
      thumbnailUrl: payload.thumbnailUrl || null,
      priceInPaise: payload.priceInPaise,
      status: payload.status || existing.status,
      classId: payload.classId || null,
      classLabel: payload.classLabel || null,
      subject: payload.subject || null,
      color: payload.color || null,
      emoji: payload.emoji || null,
      tagline: payload.tagline || null,
      studentsLabel: payload.studentsLabel || null,
      featuresJson: payload.features || [],
    },
  });

  res.json({ success: true, course });
});

const deleteCourse = asyncHandler(async (req, res) => {
  const existing = await prisma.course.findUnique({ where: { id: req.params.courseId } });
  if (!existing) throw new AppError(404, "Course not found");

  await prisma.course.delete({ where: { id: req.params.courseId } });
  res.json({ success: true, message: "Course deleted" });
});

const publishCourse = asyncHandler(async (req, res) => {
  const existing = await prisma.course.findUnique({ where: { id: req.params.courseId } });
  if (!existing) throw new AppError(404, "Course not found");

  const course = await prisma.course.update({
    where: { id: req.params.courseId },
    data: { status: req.body.status || "PUBLISHED" },
  });
  res.json({ success: true, course });
});

const createClass = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  const classLevel = await prisma.classLevel.create({
    data: {
      code: payload.code || null,
      name: payload.name,
      orderIndex: payload.orderIndex ?? 0,
    },
  });
  res.status(201).json({ success: true, classLevel });
});

const updateClass = asyncHandler(async (req, res) => {
  const existing = await prisma.classLevel.findUnique({ where: { id: req.params.classId } });
  if (!existing) throw new AppError(404, "Class not found");

  const payload = req.validated.body;
  const classLevel = await prisma.classLevel.update({
    where: { id: existing.id },
    data: {
      code: payload.code || null,
      name: payload.name,
      orderIndex: payload.orderIndex ?? existing.orderIndex,
    },
  });

  if (existing.name !== payload.name) {
    await Promise.all([
      prisma.course.updateMany({ where: { classLabel: existing.name }, data: { classLabel: payload.name } }),
      prisma.subject.updateMany({ where: { classLabel: existing.name }, data: { classLabel: payload.name } }),
      prisma.chapter.updateMany({ where: { classLabel: existing.name }, data: { classLabel: payload.name } }),
    ]);
  }

  res.json({ success: true, classLevel });
});

const deleteClass = asyncHandler(async (req, res) => {
  const existing = await prisma.classLevel.findUnique({ where: { id: req.params.classId } });
  if (!existing) throw new AppError(404, "Class not found");

  await prisma.classLevel.delete({ where: { id: existing.id } });
  res.json({ success: true, message: "Class deleted" });
});

const createSubject = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  const subject = await prisma.subject.create({
    data: {
      code: payload.code || null,
      name: payload.name,
      classLabel: payload.classLabel || null,
    },
  });
  res.status(201).json({ success: true, subject });
});

const updateSubject = asyncHandler(async (req, res) => {
  const existing = await prisma.subject.findUnique({ where: { id: req.params.subjectId } });
  if (!existing) throw new AppError(404, "Subject not found");

  const payload = req.validated.body;
  const subject = await prisma.subject.update({
    where: { id: existing.id },
    data: {
      code: payload.code || null,
      name: payload.name,
      classLabel: payload.classLabel || null,
    },
  });

  if (existing.name !== payload.name) {
    await Promise.all([
      prisma.course.updateMany({ where: { subject: existing.name }, data: { subject: payload.name } }),
      prisma.chapter.updateMany({ where: { subject: existing.name }, data: { subject: payload.name } }),
    ]);
  }

  res.json({ success: true, subject });
});

const deleteSubject = asyncHandler(async (req, res) => {
  const existing = await prisma.subject.findUnique({ where: { id: req.params.subjectId } });
  if (!existing) throw new AppError(404, "Subject not found");

  await prisma.subject.delete({ where: { id: existing.id } });
  res.json({ success: true, message: "Subject deleted" });
});

const createChapter = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  const chapter = await prisma.chapter.create({
    data: {
      code: payload.code || null,
      title: payload.title,
      classLabel: payload.classLabel || null,
      subject: payload.subject || null,
      courseId: payload.courseId || null,
      orderIndex: payload.orderIndex ?? 0,
      videoUrl: payload.videoUrl || null,
      pdfStoragePath: payload.pdfUrl || null,
      pdfFileName: payload.pdfFileName || null,
      pdfMimeType: payload.pdfMimeType || null,
      pdfSize: payload.pdfSize ?? null,
      assessmentsJson: payload.assessments || undefined,
    },
    include: { course: { select: { id: true, title: true } } },
  });

  res.status(201).json({ success: true, chapter: serializeChapter(chapter) });
});

const updateChapter = asyncHandler(async (req, res) => {
  const existing = await prisma.chapter.findUnique({ where: { id: req.params.chapterId } });
  if (!existing) throw new AppError(404, "Chapter not found");

  const payload = req.validated.body;
  const chapter = await prisma.chapter.update({
    where: { id: existing.id },
    data: {
      code: payload.code || null,
      title: payload.title,
      classLabel: payload.classLabel || null,
      subject: payload.subject || null,
      courseId: payload.courseId || null,
      orderIndex: payload.orderIndex ?? existing.orderIndex,
      videoUrl: payload.videoUrl !== undefined ? (payload.videoUrl || null) : existing.videoUrl,
      pdfStoragePath: payload.pdfUrl !== undefined ? (payload.pdfUrl || null) : existing.pdfStoragePath,
      pdfFileName: payload.pdfFileName !== undefined ? (payload.pdfFileName || null) : existing.pdfFileName,
      pdfMimeType: payload.pdfMimeType !== undefined ? (payload.pdfMimeType || null) : existing.pdfMimeType,
      pdfSize: payload.pdfSize !== undefined ? payload.pdfSize : existing.pdfSize,
      assessmentsJson: payload.assessments !== undefined ? payload.assessments : existing.assessmentsJson,
    },
    include: { course: { select: { id: true, title: true } } },
  });

  if (existing.title !== payload.title) {
    await prisma.lesson.updateMany({
      where: { chapterTitle: existing.title, ...(existing.courseId ? { courseId: existing.courseId } : {}) },
      data: { chapterTitle: payload.title },
    });
  }

  res.json({ success: true, chapter: serializeChapter(chapter) });
});

const deleteChapter = asyncHandler(async (req, res) => {
  const existing = await prisma.chapter.findUnique({ where: { id: req.params.chapterId } });
  if (!existing) throw new AppError(404, "Chapter not found");

  await prisma.chapter.delete({ where: { id: existing.id } });
  res.json({ success: true, message: "Chapter deleted" });
});

const createLesson = asyncHandler(async (req, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });
  if (!course) throw new AppError(404, "Course not found");

  const payload = req.validated.body;
  const slug = await buildUniqueLessonSlug(course.id, payload.title);

  const lesson = await prisma.lesson.create({
    data: {
      courseId: course.id,
      code: payload.code || null,
      title: payload.title,
      slug,
      description: payload.description,
      orderIndex: payload.orderIndex,
      chapterTitle: payload.chapterTitle || null,
      chapterIndex: payload.chapterIndex || null,
      durationSeconds: payload.durationSeconds,
      thumbnailUrl: payload.thumbnailUrl || null,
      priceInPaise: payload.priceInPaise || null,
      viewsLabel: payload.viewsLabel || null,
      ratingLabel: payload.ratingLabel || null,
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
      code: payload.code || null,
      title: payload.title,
      slug,
      description: payload.description,
      orderIndex: payload.orderIndex,
      chapterTitle: payload.chapterTitle || null,
      chapterIndex: payload.chapterIndex || null,
      durationSeconds: payload.durationSeconds,
      thumbnailUrl: payload.thumbnailUrl || null,
      priceInPaise: payload.priceInPaise || null,
      viewsLabel: payload.viewsLabel || null,
      ratingLabel: payload.ratingLabel || null,
      isPreview: payload.isPreview ?? lesson.isPreview,
      bunnyVideoId: payload.bunnyVideoId || null,
      bunnyEmbedUrl: payload.bunnyEmbedUrl || null,
    },
  });

  res.json({ success: true, lesson: updated });
});

const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId } });
  if (!lesson) throw new AppError(404, "Lesson not found");
  if (lesson.courseId !== req.params.courseId) throw new AppError(404, "Lesson not found");

  await prisma.lesson.delete({ where: { id: req.params.lessonId } });
  res.json({ success: true, message: "Lesson deleted" });
});

const updateCoursePrice = asyncHandler(async (req, res) => {
  const course = await prisma.course.update({
    where: { id: req.params.courseId },
    data: { priceInPaise: req.validated.body.priceInPaise },
  });
  res.json({ success: true, course });
});

const updateLessonPrice = asyncHandler(async (req, res) => {
  const lesson = await prisma.lesson.update({
    where: { id: req.params.lessonId },
    data: { priceInPaise: req.validated.body.priceInPaise },
  });
  res.json({ success: true, lesson });
});

const deleteCoursePrice = asyncHandler(async (req, res) => {
  const existing = await prisma.course.findUnique({ where: { id: req.params.courseId } });
  if (!existing) throw new AppError(404, "Course not found");

  const course = await prisma.course.update({
    where: { id: req.params.courseId },
    data: { priceInPaise: 0 },
  });
  res.json({ success: true, course });
});

const deleteLessonPrice = asyncHandler(async (req, res) => {
  const existing = await prisma.lesson.findUnique({ where: { id: req.params.lessonId } });
  if (!existing) throw new AppError(404, "Lesson not found");

  const lesson = await prisma.lesson.update({
    where: { id: req.params.lessonId },
    data: { priceInPaise: null },
  });
  res.json({ success: true, lesson });
});

const updateChapterPrice = asyncHandler(async (req, res) => {
  const existing = await prisma.chapter.findUnique({ where: { id: req.params.chapterId } });
  if (!existing) throw new AppError(404, "Chapter not found");

  const chapter = await prisma.chapter.update({
    where: { id: req.params.chapterId },
    data: { priceInPaise: req.validated.body.priceInPaise },
  });
  res.json({ success: true, chapter });
});

const updateClassPrice = asyncHandler(async (req, res) => {
  const { className, priceInPaise } = req.validated.body;
  const existing = await prisma.classLevel.findUnique({ where: { name: className } });
  if (!existing) throw new AppError(404, "Class not found");

  const classLevel = await prisma.classLevel.update({
    where: { name: className },
    data: { priceInPaise },
  });
  res.json({ success: true, classLevel });
});

const updateSubjectPrice = asyncHandler(async (req, res) => {
  const { subjectName, priceInPaise } = req.validated.body;
  const existing = await prisma.subject.findFirst({ where: { name: subjectName } });
  if (!existing) throw new AppError(404, "Subject not found");

  await prisma.subject.updateMany({ where: { name: subjectName }, data: { priceInPaise } });
  const subject = await prisma.subject.findFirst({ where: { name: subjectName } });
  res.json({ success: true, subject });
});

const listUsers = asyncHandler(async (_req, res) => {
  const users = await prisma.user.findMany({
    select: selectUser,
    orderBy: { createdAt: "desc" },
  });
  res.json({ success: true, users });
});

const createUser = asyncHandler(async (req, res) => {
  const payload = req.validated.body;
  const passwordHash = await bcrypt.hash(payload.password || "ChangeThis123!", 12);
  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email.toLowerCase(),
      passwordHash,
      role: payload.role || "USER",
      phone: payload.phone || null,
      gradeLabel: payload.gradeLabel || null,
      isActive: payload.isActive ?? true,
    },
    select: selectUser,
  });
  res.status(201).json({ success: true, user });
});

const updateUser = asyncHandler(async (req, res) => {
  const existing = await prisma.user.findUnique({ where: { id: req.params.userId } });
  if (!existing) throw new AppError(404, "User not found");

  const payload = req.validated.body;
  const data = {
    name: payload.name,
    email: payload.email.toLowerCase(),
    role: payload.role || existing.role,
    phone: payload.phone || null,
    gradeLabel: payload.gradeLabel || null,
    isActive: payload.isActive ?? existing.isActive,
  };
  if (payload.password) data.passwordHash = await bcrypt.hash(payload.password, 12);

  const user = await prisma.user.update({
    where: { id: existing.id },
    data,
    select: selectUser,
  });
  res.json({ success: true, user });
});

const deleteUser = asyncHandler(async (req, res) => {
  const existing = await prisma.user.findUnique({ where: { id: req.params.userId } });
  if (!existing) throw new AppError(404, "User not found");
  if (existing.id === req.user.id) throw new AppError(400, "You cannot delete your own admin account");

  await prisma.user.delete({ where: { id: existing.id } });
  res.json({ success: true, message: "User deleted" });
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

const grantEnrollment = asyncHandler(async (req, res) => {
  const { userId, courseId } = req.body;
  if (!userId || !courseId) throw new AppError(400, "userId and courseId are required");

  const [user, course] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.course.findUnique({ where: { id: courseId } }),
  ]);
  if (!user) throw new AppError(404, "User not found");
  if (!course) throw new AppError(404, "Course not found");

  const access = await prisma.userCourseAccess.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, source: "MANUAL", grantedByUserId: req.user.id },
    update: { source: "MANUAL", grantedByUserId: req.user.id, expiresAt: null },
    include: {
      user: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true } },
    },
  });

  res.status(201).json({ success: true, access });
});

const revokeEnrollment = asyncHandler(async (req, res) => {
  const existing = await prisma.userCourseAccess.findUnique({
    where: { id: req.params.enrollmentId },
  });
  if (!existing) throw new AppError(404, "Enrollment not found");

  await prisma.userCourseAccess.delete({ where: { id: existing.id } });
  res.json({ success: true, message: "Enrollment revoked" });
});

module.exports = {
  listAdminCatalog,
  getDashboard,
  listAdminCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  createClass,
  updateClass,
  deleteClass,
  createSubject,
  updateSubject,
  deleteSubject,
  createChapter,
  updateChapter,
  deleteChapter,
  createLesson,
  updateLesson,
  deleteLesson,
  updateCoursePrice,
  updateLessonPrice,
  deleteCoursePrice,
  deleteLessonPrice,
  updateChapterPrice,
  updateClassPrice,
  updateSubjectPrice,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listPayments,
  listEnrolledUsers,
  grantEnrollment,
  revokeEnrollment,
};
