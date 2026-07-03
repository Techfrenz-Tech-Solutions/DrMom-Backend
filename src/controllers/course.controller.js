const { prisma } = require("../lib/prisma");
const { asyncHandler, AppError } = require("../utils/http");
const {
  listPublishedCourses,
  getPublishedCourseBySlug,
  getLessonPlayback,
  getChapterMaterials,
  buildCatalog,
} = require("../services/course.service");
const { userHasCourseAccess } = require("../services/access.service");

const listCourses = asyncHandler(async (_req, res) => {
  const courses = await listPublishedCourses();
  res.json({ success: true, courses });
});

const getCatalog = asyncHandler(async (req, res) => {
  const catalog = await buildCatalog(req.user?.id);
  res.json({ success: true, ...catalog });
});

const getCourse = asyncHandler(async (req, res) => {
  const course = await getPublishedCourseBySlug(req.params.slug, req.user?.id);
  res.json({ success: true, course });
});

const getLessonAccess = asyncHandler(async (req, res) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: req.params.lessonId },
    include: { course: true },
  });

  if (!lesson || lesson.course.status !== "PUBLISHED") {
    throw new AppError(404, "Lesson not found");
  }

  const hasAccess = lesson.isPreview
    ? true
    : req.user
      ? await userHasCourseAccess({ userId: req.user.id, courseId: lesson.courseId })
      : false;

  res.json({
    success: true,
    lessonId: lesson.id,
    courseId: lesson.courseId,
    hasAccess,
    isPreview: lesson.isPreview,
    requiresPurchase: !lesson.isPreview,
  });
});

const getLessonPlaybackDetails = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError(401, "Authentication required");
  const playback = await getLessonPlayback({ lessonId: req.params.lessonId, userId: req.user.id });
  res.json({ success: true, playback });
});

const getChapterMaterialsDetails = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError(401, "Authentication required");
  const data = await getChapterMaterials({ chapterId: req.params.chapterId, userId: req.user.id });
  res.json({ success: true, ...data });
});

module.exports = {
  listCourses,
  getCatalog,
  getCourse,
  getLessonAccess,
  getLessonPlaybackDetails,
  getChapterMaterialsDetails,
};
