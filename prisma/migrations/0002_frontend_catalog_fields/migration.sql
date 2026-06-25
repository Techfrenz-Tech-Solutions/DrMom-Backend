-- AlterTable
ALTER TABLE "public"."Course"
ADD COLUMN "code" TEXT,
ADD COLUMN "classId" TEXT,
ADD COLUMN "classLabel" TEXT,
ADD COLUMN "subject" TEXT,
ADD COLUMN "color" TEXT,
ADD COLUMN "emoji" TEXT,
ADD COLUMN "tagline" TEXT,
ADD COLUMN "studentsLabel" TEXT,
ADD COLUMN "featuresJson" JSONB;

-- AlterTable
ALTER TABLE "public"."Lesson"
ADD COLUMN "code" TEXT,
ADD COLUMN "chapterTitle" TEXT,
ADD COLUMN "chapterIndex" INTEGER,
ADD COLUMN "thumbnailUrl" TEXT,
ADD COLUMN "priceInPaise" INTEGER,
ADD COLUMN "viewsLabel" TEXT,
ADD COLUMN "ratingLabel" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "public"."Course"("code");

-- CreateIndex
CREATE INDEX "Course_classId_idx" ON "public"."Course"("classId");

-- CreateIndex
CREATE INDEX "Course_classLabel_idx" ON "public"."Course"("classLabel");

-- CreateIndex
CREATE INDEX "Course_subject_idx" ON "public"."Course"("subject");

-- CreateIndex
CREATE INDEX "Lesson_chapterTitle_idx" ON "public"."Lesson"("chapterTitle");
