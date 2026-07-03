const { prisma } = require("../lib/prisma");
const { userHasCourseAccess } = require("./access.service");
const { getPlaybackPayload, signBunnyPullZoneUrl } = require("../utils/bunny");
const { AppError } = require("../utils/http");

const publicCourseSelect = {
  id: true,
  code: true,
  title: true,
  slug: true,
  description: true,
  shortDescription: true,
  thumbnailUrl: true,
  priceInPaise: true,
  status: true,
  classId: true,
  classLabel: true,
  subject: true,
  color: true,
  emoji: true,
  tagline: true,
  studentsLabel: true,
  featuresJson: true,
  createdAt: true,
  updatedAt: true,
  lessons: {
    orderBy: { orderIndex: "asc" },
    select: {
      id: true,
      code: true,
      title: true,
      slug: true,
      description: true,
      orderIndex: true,
      chapterTitle: true,
      chapterIndex: true,
      durationSeconds: true,
      thumbnailUrl: true,
      priceInPaise: true,
      viewsLabel: true,
      ratingLabel: true,
      isPreview: true,
      bunnyVideoId: true,
      bunnyEmbedUrl: true,
    },
  },
};

const formatDuration = (durationSeconds) => {
  if (!durationSeconds) return "";
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = String(durationSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const rupees = (paise) => `₹${Math.round((paise || 0) / 100)}`;

const serializeLesson = (lesson, hasAccess = false) => ({
  id: lesson.id,
  code: lesson.code,
  title: lesson.title,
  slug: lesson.slug,
  description: lesson.description,
  desc: lesson.description || "",
  orderIndex: lesson.orderIndex,
  chapter: lesson.chapterTitle || "Chapter 1",
  chapterIndex: lesson.chapterIndex || 1,
  durationSeconds: lesson.durationSeconds,
  duration: formatDuration(lesson.durationSeconds),
  thumbnail: signBunnyPullZoneUrl(lesson.thumbnailUrl),
  thumbnailUrl: signBunnyPullZoneUrl(lesson.thumbnailUrl),
  priceInPaise: lesson.priceInPaise,
  price: lesson.priceInPaise ? rupees(lesson.priceInPaise) : undefined,
  views: lesson.viewsLabel || "",
  rating: lesson.ratingLabel || "",
  isPreview: lesson.isPreview,
  isLocked: !lesson.isPreview && !hasAccess,
});

const serializeCourse = (course, hasAccess = false) => ({
  ...course,
  features: Array.isArray(course.featuresJson) ? course.featuresJson : [],
  price: rupees(course.priceInPaise),
  class: {
    id: course.classId,
    label: course.classLabel,
    fullLabel: course.classLabel,
    color: course.color,
    emoji: course.emoji,
    tagline: course.tagline,
    students: course.studentsLabel,
  },
  ownsCourse: hasAccess,
  lessons: course.lessons.map((lesson) => serializeLesson(lesson, hasAccess)),
});

const listPublishedCourses = () =>
  prisma.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    select: publicCourseSelect,
  }).then((courses) => courses.map((course) => serializeCourse(course)));

const getPublishedCourseBySlug = async (slug, userId) => {
  const course = await prisma.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: publicCourseSelect,
  });

  if (!course) throw new AppError(404, "Course not found");

  const hasAccess = userId
    ? await userHasCourseAccess({ userId, courseId: course.id })
    : false;

  return serializeCourse(course, hasAccess);
};

const buildCatalog = async (userId) => {
  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ classLabel: "asc" }, { subject: "asc" }, { createdAt: "desc" }],
    select: publicCourseSelect,
  });

  const accessRows = userId
    ? await prisma.userCourseAccess.findMany({
        where: { userId, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        select: { courseId: true },
      })
    : [];
  const ownedCourseIds = new Set(accessRows.map((row) => row.courseId));

  const serializedCourses = courses.map((course) => serializeCourse(course, ownedCourseIds.has(course.id)));
  const classesById = new Map();
  const subjectsByClass = {};
  const videosData = {};

  for (const course of serializedCourses) {
    const classId = course.classId || course.slug;
    const classLabel = course.classLabel || course.title;

    if (!classesById.has(classId)) {
      classesById.set(classId, {
        id: classId,
        label: classLabel,
        fullLabel: classLabel,
        color: course.color || "#34d399",
        emoji: course.emoji || "📚",
        tagline: course.tagline || course.shortDescription || "",
        students: course.studentsLabel || "",
      });
    }

    if (!subjectsByClass[classId]) subjectsByClass[classId] = [];
    if (course.subject && !subjectsByClass[classId].includes(course.subject)) {
      subjectsByClass[classId].push(course.subject);
    }

    if (!videosData[classId]) videosData[classId] = {};
    const subject = course.subject || "General";
    if (!videosData[classId][subject]) videosData[classId][subject] = [];

    videosData[classId][subject].push(
      ...course.lessons.map((lesson) => ({
        ...lesson,
        classId,
        courseId: course.id,
        courseSlug: course.slug,
        subject,
      })),
    );
  }

  return {
    classes: Array.from(classesById.values()),
    subjects: subjectsByClass,
    videosData,
    courses: serializedCourses,
    subscriptionPlans: [
      {
        id: "single",
        name: "Single Video",
        price: "₹19",
        period: "per video",
        color: "#38bdf8",
        cta: "Buy Video",
        popular: false,
        features: ["Access to 1 selected video", "HD video quality", "Downloadable notes", "Valid for 30 days"],
      },
      {
        id: "chapter",
        name: "Chapter Pack",
        price: "₹99",
        period: "per chapter",
        color: "#c084fc",
        cta: "Buy Chapter",
        popular: false,
        features: ["All videos in a chapter", "HD video quality", "Downloadable notes", "Practice worksheets", "Valid for 60 days"],
      },
      {
        id: "class",
        name: "Class Package",
        price: serializedCourses[0] ? rupees(serializedCourses[0].priceInPaise) : "₹499",
        period: "per class/year",
        color: "#34d399",
        cta: "Buy Class Pack",
        popular: true,
        features: ["All subjects for one class", "HD + 4K video quality", "Notes & worksheets", "Progress tracking", "Doubt clearing sessions", "Valid for 1 year"],
      },
      {
        id: "full",
        name: "Full Access",
        price: "₹999",
        period: "all classes/year",
        color: "#fbbf24",
        cta: "Get Full Access",
        popular: false,
        features: ["All classes LKG to Grade 5", "4K video quality", "Notes, worksheets & tests", "Live sessions", "Parent dashboard", "Priority support", "Valid for 1 year"],
      },
    ],
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
    videoId: playback.videoId,
    embedUrl: playback.embedUrl,
  };
};

module.exports = {
  listPublishedCourses,
  getPublishedCourseBySlug,
  getLessonPlayback,
  buildCatalog,
};
