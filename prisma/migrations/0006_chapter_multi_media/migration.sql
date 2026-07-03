-- Additive only. The old singular videoUrl/pdfStoragePath/pdfFileName/
-- pdfMimeType/pdfSize columns are NOT dropped and NOT touched — they stay
-- physically in the table as a safety net, just unmapped in Prisma from
-- here on. Existing single video/PDF data is copied (not moved) into the
-- new array columns below so it keeps showing up in the admin UI.

ALTER TABLE "public"."Chapter"
  ADD COLUMN "videosJson" JSONB,
  ADD COLUMN "materialsJson" JSONB;

UPDATE "public"."Chapter"
SET "videosJson" = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'embedUrl', "videoUrl",
    'title', NULL
  )
)
WHERE "videoUrl" IS NOT NULL AND "videoUrl" <> '';

UPDATE "public"."Chapter"
SET "materialsJson" = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'storagePath', "pdfStoragePath",
    'fileName', "pdfFileName",
    'mimeType', "pdfMimeType",
    'size', "pdfSize"
  )
)
WHERE "pdfStoragePath" IS NOT NULL AND "pdfStoragePath" <> '';
