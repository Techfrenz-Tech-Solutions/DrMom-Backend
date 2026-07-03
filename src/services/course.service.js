const { prisma } = require("../lib/prisma");
const { userHasCourseAccess } = require("./access.service");
const { getPlaybackPayload, buildBunnyEmbedUrl, signBunnyPullZoneUrl } = require("../utils/bunny");
const { signStorageUrl, isSignedDeliveryConfigured } = require("../utils/bunnyStorage");
const { env } = require("../config/env");
const { AppError } = require("../utils/http");

// The platform hierarchy is Class -> Subject -> Course -> Chapter. Public
// video content is read from Chapter.videosJson (a chapter can hold several
// videos) rather than the old Lesson table — see serializeChapterVideos
// below. Lesson/getLessonPlayback are kept for backward compatibility only;
// see the comment above getLessonPlayback for why.
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
  chapters: {
    orderBy: { orderIndex: "asc" },
    select: {
      id: true,
      code: true,
      title: true,
      orderIndex: true,
      videosJson: true,
      priceInPaise: true,
    },
  },
};

const rupees = (paise) => `₹${Math.round((paise || 0) / 100)}`;

// Bunny Stream auto-generates a thumbnail per video at this path on the
// Stream pull zone — same derivation the old per-Lesson thumbnailUrl relied
// on, just computed on the fly instead of stored, since a chapter can now
// have many videos and storing one URL per item would go stale the same way
// a stored signed URL would.
const buildVideoThumbnailUrl = (bunnyVideoId) => {
  if (!bunnyVideoId || !env.bunnyPullZone) return null;
  return signBunnyPullZoneUrl(`https://${env.bunnyPullZone}.b-cdn.net/${bunnyVideoId}/thumbnail.jpg`);
};

// Flattens a chapter's videosJson array into the same "video card" shape
// the website already expects (previously produced from Lesson rows) — see
// VideoCard.jsx / VideoContent.jsx, which are unchanged by this switch.
// Price is per-chapter now (chapter.priceInPaise), not per-video — the old
// per-Lesson price was finer-grained than the Class/Subject/Course/Chapter
// pricing hierarchy the rest of the platform uses.
const serializeChapterVideos = (course, chapter, hasAccess = false) => {
  const videos = Array.isArray(chapter.videosJson) ? chapter.videosJson : [];
  return videos.map((video) => ({
    id: video.id,
    chapterId: chapter.id,
    courseId: course.id,
    title: video.title || chapter.title,
    desc: chapter.title,
    chapter: chapter.title,
    chapterIndex: chapter.orderIndex ?? 1,
    thumbnail: buildVideoThumbnailUrl(video.bunnyVideoId),
    thumbnailUrl: buildVideoThumbnailUrl(video.bunnyVideoId),
    priceInPaise: chapter.priceInPaise,
    price: chapter.priceInPaise ? rupees(chapter.priceInPaise) : undefined,
    isPreview: Boolean(video.isPreview),
    isLocked: !video.isPreview && !hasAccess,
  }));
};

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
  // Field name kept as `lessons` for frontend compatibility (nothing on the
  // website reads this key directly outside of buildCatalog below, but
  // keeping it avoids touching every consumer for a rename with no
  // functional benefit) — the items themselves are chapter-video-sourced.
  lessons: course.chapters.flatMap((chapter) => serializeChapterVideos(course, chapter, hasAccess)),
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

// Legacy — the website no longer calls this (VideoCard.jsx now calls
// getChapterVideoPlayback below, matching the Chapter-based catalog).
// Retained, not removed, because: (1) the Lesson table itself still exists
// and is not being dropped, so its data should stay queryable through the
// same access-control path it always used; (2) migration 0007 backfills a
// Lesson's real video into a Chapter, not the other way — a Lesson row can
// keep existing (e.g. as a historical record) independent of the Chapter
// copy of its video; (3) removing this outright, versus just no longer
// calling it from the frontend, isn't necessary to satisfy "consistent
// hierarchy on the website" and carries needless risk of breaking something
// that isn't visible from a code search (e.g. an external integration).
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

// Current playback path: a video lives inside Chapter.videosJson, gated by
// the chapter's course the same way lesson playback always was.
const getChapterVideoPlayback = async ({ chapterId, videoId, userId }) => {
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) throw new AppError(404, "Chapter not found");

  const videos = Array.isArray(chapter.videosJson) ? chapter.videosJson : [];
  const video = videos.find((v) => v.id === videoId);
  if (!video) throw new AppError(404, "Video not found");

  const hasAccess = video.isPreview
    ? true
    : chapter.courseId
      ? await userHasCourseAccess({ userId, courseId: chapter.courseId })
      : false;

  if (!hasAccess) {
    throw new AppError(403, "Purchase required to access this video");
  }

  const embedUrl = buildBunnyEmbedUrl({ bunnyEmbedUrl: video.embedUrl, bunnyVideoId: video.bunnyVideoId });
  if (!embedUrl) {
    throw new AppError(422, "Video does not have playable Bunny Stream metadata configured");
  }

  return {
    chapterId: chapter.id,
    courseId: chapter.courseId,
    videoId: video.id,
    title: video.title || chapter.title,
    isPreview: Boolean(video.isPreview),
    embedUrl,
  };
};

// Chapter PDF/notes materials — gated the same way lesson video playback is:
// require ownership of the parent course before ever touching Bunny Storage.
// A chapter can now carry multiple materials; returns all of them signed.
const getChapterMaterials = async ({ chapterId, userId }) => {
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
  if (!chapter) throw new AppError(404, "Chapter not found");

  const materials = chapter.materialsJson || [];
  if (!materials.length) throw new AppError(404, "This chapter has no PDF/notes material");

  // A chapter with no parent course has no purchase record to check access
  // against under the current access model — deny by default rather than
  // guessing an access rule. See report: TODO — clarify intended behavior
  // for standalone (courseless) chapters if that's a real use case.
  if (!chapter.courseId) {
    throw new AppError(403, "This material is not available for access");
  }

  const hasAccess = await userHasCourseAccess({ userId, courseId: chapter.courseId });
  if (!hasAccess) {
    throw new AppError(403, "Purchase required to access this material");
  }

  if (!isSignedDeliveryConfigured()) {
    throw new AppError(503, "Material delivery is not configured on this server");
  }

  const ttlSeconds = 300;
  return {
    chapterId: chapter.id,
    materials: materials.map((m) => ({
      id: m.id,
      fileName: m.fileName || null,
      mimeType: m.mimeType || null,
      size: m.size || null,
      url: signStorageUrl(m.storagePath, ttlSeconds),
      expiresIn: ttlSeconds,
    })),
  };
};

module.exports = {
  listPublishedCourses,
  getPublishedCourseBySlug,
  getLessonPlayback,
  getChapterVideoPlayback,
  getChapterMaterials,
  buildCatalog,
};
