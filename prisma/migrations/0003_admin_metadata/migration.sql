CREATE TABLE "public"."ClassLevel" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassLevel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Subject" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "classLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."Chapter" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "title" TEXT NOT NULL,
    "classLabel" TEXT,
    "subject" TEXT,
    "courseId" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClassLevel_code_key" ON "public"."ClassLevel"("code");
CREATE UNIQUE INDEX "ClassLevel_name_key" ON "public"."ClassLevel"("name");
CREATE INDEX "ClassLevel_orderIndex_idx" ON "public"."ClassLevel"("orderIndex");

CREATE UNIQUE INDEX "Subject_code_key" ON "public"."Subject"("code");
CREATE UNIQUE INDEX "Subject_name_classLabel_key" ON "public"."Subject"("name", "classLabel");
CREATE INDEX "Subject_classLabel_idx" ON "public"."Subject"("classLabel");

CREATE UNIQUE INDEX "Chapter_code_key" ON "public"."Chapter"("code");
CREATE INDEX "Chapter_classLabel_idx" ON "public"."Chapter"("classLabel");
CREATE INDEX "Chapter_subject_idx" ON "public"."Chapter"("subject");
CREATE INDEX "Chapter_courseId_idx" ON "public"."Chapter"("courseId");

ALTER TABLE "public"."Chapter" ADD CONSTRAINT "Chapter_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
