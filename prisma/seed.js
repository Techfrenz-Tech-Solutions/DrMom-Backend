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
    },
    create: {
      title: courseTitle,
      slug: slugify(courseTitle),
      description: "Foundation math course for Grade 1 students.",
      shortDescription: "Core arithmetic, counting, and problem solving.",
      priceInPaise: 49900,
      status: "PUBLISHED",
      thumbnailUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b",
    },
  });

  const lessonSeeds = [
    {
      title: "Counting to 100",
      orderIndex: 1,
      isPreview: true,
      durationSeconds: 420,
    },
    {
      title: "Addition Basics",
      orderIndex: 2,
      isPreview: false,
      durationSeconds: 540,
    },
  ];

  for (const lesson of lessonSeeds) {
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
