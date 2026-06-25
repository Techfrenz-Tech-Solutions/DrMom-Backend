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
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().min(10),
    shortDescription: z.string().trim().max(200).optional(),
    thumbnailUrl: z.string().url().optional().or(z.literal("")),
    priceInPaise: z.number().int().min(0),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  }),
});

const adminLessonSchema = z.object({
  params: z.object({
    courseId: z.string().min(1),
    lessonId: z.string().optional(),
  }),
  query: z.object({}).optional(),
  body: z.object({
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().optional(),
    orderIndex: z.number().int().min(1),
    durationSeconds: z.number().int().min(0).optional(),
    isPreview: z.boolean().optional(),
    bunnyVideoId: z.string().trim().optional(),
    bunnyEmbedUrl: z.string().trim().url().optional().or(z.literal("")),
  }),
});

module.exports = { idParamSchema, adminCourseSchema, adminLessonSchema };
