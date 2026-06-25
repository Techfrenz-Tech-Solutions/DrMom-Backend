const { z } = require("zod");

const idParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    courseId: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    lessonId: z.string().min(1).optional(),
  }),
});

const adminCourseSchema = z.object({
  params: z.object({ courseId: z.string().optional() }).optional(),
  query: z.object({}).optional(),
  body: z.object({
    code: z.string().trim().max(50).optional(),
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().min(10),
    shortDescription: z.string().trim().max(200).optional(),
    thumbnailUrl: z.string().url().optional().or(z.literal("")),
    priceInPaise: z.number().int().min(0),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
    classId: z.string().trim().max(80).optional(),
    classLabel: z.string().trim().max(80).optional(),
    subject: z.string().trim().max(120).optional(),
    color: z.string().trim().max(40).optional(),
    emoji: z.string().trim().max(16).optional(),
    tagline: z.string().trim().max(160).optional(),
    studentsLabel: z.string().trim().max(40).optional(),
    features: z.array(z.string().trim().min(1).max(160)).optional(),
  }),
});

const adminLessonSchema = z.object({
  params: z.object({
    courseId: z.string().min(1),
    lessonId: z.string().optional(),
  }),
  query: z.object({}).optional(),
  body: z.object({
    code: z.string().trim().max(50).optional(),
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().optional(),
    orderIndex: z.number().int().min(1),
    chapterTitle: z.string().trim().max(150).optional(),
    chapterIndex: z.number().int().min(1).optional(),
    durationSeconds: z.number().int().min(0).optional(),
    thumbnailUrl: z.string().url().optional().or(z.literal("")),
    priceInPaise: z.number().int().min(0).optional(),
    viewsLabel: z.string().trim().max(40).optional(),
    ratingLabel: z.string().trim().max(12).optional(),
    isPreview: z.boolean().optional(),
    bunnyVideoId: z.string().trim().optional(),
    bunnyEmbedUrl: z.string().trim().url().optional().or(z.literal("")),
  }),
});

const adminClassSchema = z.object({
  params: z.object({ classId: z.string().optional() }).optional(),
  query: z.object({}).optional(),
  body: z.object({
    code: z.string().trim().max(50).optional(),
    name: z.string().trim().min(1).max(80),
    orderIndex: z.number().int().min(0).optional(),
  }),
});

const adminSubjectSchema = z.object({
  params: z.object({ subjectId: z.string().optional() }).optional(),
  query: z.object({}).optional(),
  body: z.object({
    code: z.string().trim().max(50).optional(),
    name: z.string().trim().min(1).max(120),
    classLabel: z.string().trim().max(80).optional().or(z.literal("")),
  }),
});

const adminChapterSchema = z.object({
  params: z.object({ chapterId: z.string().optional() }).optional(),
  query: z.object({}).optional(),
  body: z.object({
    code: z.string().trim().max(50).optional(),
    title: z.string().trim().min(1).max(150),
    classLabel: z.string().trim().max(80).optional().or(z.literal("")),
    subject: z.string().trim().max(120).optional().or(z.literal("")),
    courseId: z.string().trim().optional().or(z.literal("")),
    orderIndex: z.number().int().min(0).optional(),
  }),
});

const adminUserSchema = z.object({
  params: z.object({ userId: z.string().optional() }).optional(),
  query: z.object({}).optional(),
  body: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email(),
    password: z.string().min(8).max(120).optional(),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    gradeLabel: z.string().trim().max(80).optional().or(z.literal("")),
    role: z.enum(["USER", "ADMIN"]).optional(),
    isActive: z.boolean().optional(),
  }),
});

const adminCoursePriceSchema = z.object({
  params: z.object({ courseId: z.string().min(1) }),
  query: z.object({}).optional(),
  body: z.object({
    priceInPaise: z.number().int().min(0),
  }),
});

const adminLessonPriceSchema = z.object({
  params: z.object({ lessonId: z.string().min(1) }),
  query: z.object({}).optional(),
  body: z.object({
    priceInPaise: z.number().int().min(0),
  }),
});

module.exports = {
  idParamSchema,
  adminCourseSchema,
  adminLessonSchema,
  adminClassSchema,
  adminSubjectSchema,
  adminChapterSchema,
  adminUserSchema,
  adminCoursePriceSchema,
  adminLessonPriceSchema,
};
