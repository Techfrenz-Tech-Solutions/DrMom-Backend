const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { env } = require("../src/config/env");
const { slugify } = require("../src/utils/slugify");

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash(env.defaultAdminPassword, 12);

  await prisma.user.upsert({
    where: { email: env.defaultAdminEmail },
    update: {
      name: env.defaultAdminName,
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      isActive: true,
    },
    create: {
      name: env.defaultAdminName,
      email: env.defaultAdminEmail,
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  const courseTitle = "Grade 1 Mathematics Foundation";
  const course = await prisma.course.upsert({
    where: { slug: slugify(courseTitle) },
    update: {
      description: "Foundation math course for Grade 1 students.",
      priceInPaise: 49900,
      status: "PUBLISHED",
      code: "CRS-G1-MATH",
      classId: "class1",
      classLabel: "Grade 1",
      subject: "Mathematics",
      color: "#c084fc",
      emoji: "🚀",
      tagline: "Igniting curiosity",
      studentsLabel: "3.2k",
      featuresJson: ["All mathematics lessons", "HD video access", "Notes and worksheets"],
    },
    create: {
      code: "CRS-G1-MATH",
      title: courseTitle,
      slug: slugify(courseTitle),
      description: "Foundation math course for Grade 1 students.",
      shortDescription: "Core arithmetic, counting, and problem solving.",
      priceInPaise: 49900,
      status: "PUBLISHED",
      thumbnailUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
      classId: "class1",
      classLabel: "Grade 1",
      subject: "Mathematics",
      color: "#c084fc",
      emoji: "🚀",
      tagline: "Igniting curiosity",
      studentsLabel: "3.2k",
      featuresJson: ["All mathematics lessons", "HD video access", "Notes and worksheets"],
    },
  });

  const lessonSeeds = [
    {
      code: "LES-G1-MATH-001",
      title: "Counting to 100",
      orderIndex: 1,
      chapterTitle: "Chapter 1: Numbers 1-100",
      chapterIndex: 1,
      isPreview: true,
      durationSeconds: 420,
      thumbnailUrl: "https://picsum.photos/seed/g1mathcounting/400/225",
      priceInPaise: 1900,
      viewsLabel: "1.2k",
      ratingLabel: "4.8",
    },
    {
      code: "LES-G1-MATH-002",
      title: "Addition Basics",
      orderIndex: 2,
      chapterTitle: "Chapter 2: Addition",
      chapterIndex: 2,
      isPreview: false,
      durationSeconds: 540,
      thumbnailUrl: "https://picsum.photos/seed/g1mathaddition/400/225",
      priceInPaise: 1900,
      viewsLabel: "1.7k",
      ratingLabel: "4.9",
    },
  ];

  await prisma.classLevel.upsert({
    where: { name: "Grade 1" },
    update: { code: "CLS-G1", orderIndex: 1 },
    create: { code: "CLS-G1", name: "Grade 1", orderIndex: 1 },
  });

  await prisma.subject.upsert({
    where: { name_classLabel: { name: "Mathematics", classLabel: "Grade 1" } },
    update: { code: "SUB-G1-MATH" },
    create: { code: "SUB-G1-MATH", name: "Mathematics", classLabel: "Grade 1" },
  });

  for (const lesson of lessonSeeds) {
    await prisma.chapter.upsert({
      where: { code: `CHP-G1-MATH-${String(lesson.chapterIndex).padStart(3, "0")}` },
      update: {
        title: lesson.chapterTitle,
        classLabel: "Grade 1",
        subject: "Mathematics",
        courseId: course.id,
        orderIndex: lesson.chapterIndex,
      },
      create: {
        code: `CHP-G1-MATH-${String(lesson.chapterIndex).padStart(3, "0")}`,
        title: lesson.chapterTitle,
        classLabel: "Grade 1",
        subject: "Mathematics",
        courseId: course.id,
        orderIndex: lesson.chapterIndex,
      },
    });

    await prisma.lesson.upsert({
      where: {
        courseId_slug: {
          courseId: course.id,
          slug: slugify(lesson.title),
        },
      },
      update: lesson,
      create: {
        ...lesson,
        courseId: course.id,
        slug: slugify(lesson.title),
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
