-- Additive, nullable-only migration. No data loss, no existing rows touched.

-- Chapter: video/PDF content + per-chapter price override + quiz/assessment data
-- pdfStoragePath holds an internal Bunny Storage path/key, never a public URL —
-- access is brokered through a short-lived signed URL at request time.
ALTER TABLE "public"."Chapter"
  ADD COLUMN "videoUrl" TEXT,
  ADD COLUMN "pdfStoragePath" TEXT,
  ADD COLUMN "pdfFileName" TEXT,
  ADD COLUMN "pdfMimeType" TEXT,
  ADD COLUMN "pdfSize" INTEGER,
  ADD COLUMN "assessmentsJson" JSONB,
  ADD COLUMN "priceInPaise" INTEGER;

-- ClassLevel: per-class price override
ALTER TABLE "public"."ClassLevel"
  ADD COLUMN "priceInPaise" INTEGER;

-- Subject: per-subject price override
ALTER TABLE "public"."Subject"
  ADD COLUMN "priceInPaise" INTEGER;
