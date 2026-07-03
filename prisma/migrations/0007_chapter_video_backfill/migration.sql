-- Backfill: the public website is switching from reading video content off
-- Lesson to reading it off Chapter.videosJson (chapters can hold multiple
-- videos now). Any Lesson that already has a real Bunny video must be
-- copied into its corresponding Chapter's videosJson so that content does
-- not silently disappear from the live site once this ships.
--
-- The Lesson table itself is NOT touched or dropped — additive only.

-- Case 1: a Chapter already exists with the same courseId + title as the
-- Lesson's chapterTitle (this is the normal case — Chapters were already
-- being created alongside Lessons before this migration).
UPDATE "public"."Chapter" AS c
SET "videosJson" = COALESCE(c."videosJson", '[]'::jsonb) || jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'embedUrl', l."bunnyEmbedUrl",
    'bunnyVideoId', l."bunnyVideoId",
    'title', l.title,
    'isPreview', COALESCE(l."isPreview", false)
  )
)
FROM "public"."Lesson" AS l
WHERE l."courseId" = c."courseId"
  AND l."chapterTitle" = c.title
  AND l."bunnyVideoId" IS NOT NULL
  AND l."bunnyEmbedUrl" IS NOT NULL;

-- Case 2 (defensive): a Lesson with a real video whose chapterTitle has no
-- matching Chapter row at all — create one rather than lose the video.
INSERT INTO "public"."Chapter" (id, title, "classLabel", subject, "courseId", "orderIndex", "videosJson", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  l."chapterTitle",
  crs."classLabel",
  crs.subject,
  l."courseId",
  COALESCE(l."chapterIndex", 0),
  jsonb_build_array(
    jsonb_build_object(
      'id', gen_random_uuid()::text,
      'embedUrl', l."bunnyEmbedUrl",
      'bunnyVideoId', l."bunnyVideoId",
      'title', l.title,
      'isPreview', COALESCE(l."isPreview", false)
    )
  ),
  now(),
  now()
FROM "public"."Lesson" AS l
JOIN "public"."Course" AS crs ON crs.id = l."courseId"
WHERE l."bunnyVideoId" IS NOT NULL
  AND l."bunnyEmbedUrl" IS NOT NULL
  AND l."chapterTitle" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "public"."Chapter" AS c2
    WHERE c2."courseId" = l."courseId" AND c2.title = l."chapterTitle"
  );
