const { prisma } = require("../lib/prisma");
const { userHasCourseAccess } = require("./access.service");
const { getPlaybackPayload } = require("../utils/bunny");
const { AppError } = require("../utils/http");

const publicCourseSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  shortDescription: true,
  thumbnailUrl: true,
  priceInPaise: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  lessons: {
    orderBy: { orderIndex: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      orderIndex: true,
      durationSeconds: true,
      isPreview: true,
      bunnyVideoId: true,
      bunnyEmbedUrl: true,
    },
  },
};

const listPublishedCourses = () =>
  prisma.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    select: publicCourseSelect,
  });

const getPublishedCourseBySlug = async (slug, userId) => {
  const course = await prisma.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: publicCourseSelect,
  });

  if (!course) throw new AppError(404, "Course not found");

  const hasAccess = userId
    ? await userHasCourseAccess({ userId, courseId: course.id })
    : false;

  return {
    ...course,
    ownsCourse: hasAccess,
    lessons: course.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      slug: lesson.slug,
      description: lesson.description,
      orderIndex: lesson.orderIndex,
      durationSeconds: lesson.durationSeconds,
      isPreview: lesson.isPreview,
      isLocked: !lesson.isPreview && !hasAccess,
    })),
  };
};

const getLessonPlayback = async ({ lessonId, userId }) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: true },
  });

  if (!lesson || lesson.course.status !== "PUBLISHED") {
    throw new AppError(404, "Lesson not found");
  }

  const hasAccess = lesson.isPreview
    ? true
    : await userHasCourseAccess({ userId, courseId: lesson.courseId });

  if (!hasAccess) {
    throw new AppError(403, "Purchase required to access this lesson");
  }

  const playback = getPlaybackPayload(lesson);
  if (!playback.embedUrl) {
    throw new AppError(422, "Lesson does not have playable Bunny Stream metadata configured");
  }

  return {
    lessonId: lesson.id,
    courseId: lesson.courseId,
    title: lesson.title,
    isPreview: lesson.isPreview,
    playback,
  };
};

module.exports = {
  listPublishedCourses,
  getPublishedCourseBySlug,
  getLessonPlayback,
};
