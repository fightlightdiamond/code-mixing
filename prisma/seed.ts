import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "@/core/prisma";
import { ContentStatus, ProgressStatus, DifficultyLevel } from "@/types/schema";

async function main() {
  console.log("🌱 Starting seed...");

  // Create default tenant
  const defaultTenant = await prisma.tenant.create({
    data: {
      name: "Default Tenant",
      plan: "free",
      isActive: true,
    },
  });

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@edtech.com",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "admin",
      tenant: {
        connect: { id: defaultTenant.id }
      },
      isActive: true,
      preferences: {
        language: "vi",
        theme: "light",
        notifications: true
      }
    },
  });

  // Create coach user
  const coachUser = await prisma.user.create({
    data: {
      name: "Coach Sarah",
      email: "coach@edtech.com",
      passwordHash: await bcrypt.hash("coach123", 10),
      role: "coach",
      tenant: {
        connect: { id: defaultTenant.id }
      },
      isActive: true,
    },
  });

  // Create student users
  const student1 = await prisma.user.create({
    data: {
      name: "Nguyễn Văn A",
      email: "student1@edtech.com",
      passwordHash: await bcrypt.hash("student123", 10),
      role: "student",
      tenant: {
        connect: { id: defaultTenant.id }
      },
      isActive: true,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      name: "Trần Thị B",
      email: "student2@edtech.com",
      passwordHash: await bcrypt.hash("student123", 10),
      role: "student",
      tenant: {
        connect: { id: defaultTenant.id }
      },
      isActive: true,
    },
  });

  console.log("✅ Users created");

  // Create sample course
  const course1 = await prisma.course.create({
    data: {
      title: "English for IT Professionals",
      level: "intermediate",
      tenantId: defaultTenant.id,
      createdBy: adminUser.id,
      status: "published",
    },
  });

  // Create sample unit
  const unit1 = await prisma.unit.create({
    data: {
      courseId: course1.id,
      title: "Introduction and Basic Communication",
      order: 1,
      tenantId: defaultTenant.id,
    },
  });

  // Create sample lessons
  const lesson1 = await prisma.lesson.create({
    data: {
      unitId: unit1.id,
      courseId: course1.id,
      title: "Giới thiệu bản thân trong công việc IT",
      order: 1,
      tenantId: defaultTenant.id,
      createdBy: adminUser.id,
      status: "published",
    },
  });

  const lesson2 = await prisma.lesson.create({
    data: {
      unitId: unit1.id,
      courseId: course1.id,
      title: "Thảo luận về dự án phần mềm",
      order: 2,
      tenantId: defaultTenant.id,
      createdBy: adminUser.id,
      status: "published",
    },
  });

  console.log("✅ Lessons created");

  // Create sample story with Jewish embedding method
  const story1 = await prisma.story.create({
    data: {
      lessonId: lesson1.id,
      title: "Cuộc phỏng vấn đầu tiên",
      content: `Hôm nay tôi có một interview quan trọng. Tôi đã prepare rất kỹ lưỡng. 
      Khi vào phòng, interviewer chào tôi rất friendly. Họ hỏi về experience và skills của tôi. 
      Tôi explain về các projects đã làm và technical knowledge. 
      Cuối cùng, họ nói sẽ contact tôi trong vài ngày tới.`,
      storyType: "chemdanhtu",
      tenantId: defaultTenant.id,
      createdBy: adminUser.id,
      status: "published",
    },
  });

  // Create story chunks for flexible display
  await prisma.storyChunk.createMany({
    data: [
      {
        storyId: story1.id,
        chunkOrder: 1,
        chunkText: "Hôm nay tôi có một",
        type: "normal",
      },
      {
        storyId: story1.id,
        chunkOrder: 2,
        chunkText: "interview",
        type: "chem",
      },
      {
        storyId: story1.id,
        chunkOrder: 3,
        chunkText: "quan trọng. Tôi đã",
        type: "normal",
      },
      {
        storyId: story1.id,
        chunkOrder: 4,
        chunkText: "prepare",
        type: "chem",
      },
      {
        storyId: story1.id,
        chunkOrder: 5,
        chunkText: "rất kỹ lưỡng.",
        type: "normal",
      },
    ],
  });

  console.log("✅ Stories and chunks created");

  // Create vocabulary
  await prisma.vocabulary.createMany({
    data: [
      {
        lessonId: lesson1.id,
        word: "interview",
        meaning: "phỏng vấn",
        example: "I have a job interview tomorrow.",
        audioUrl: "/audio/vocab/interview.mp3",
      },
      {
        lessonId: lesson1.id,
        word: "experience",
        meaning: "kinh nghiệm",
        example: "I have 3 years of experience in software development.",
        audioUrl: "/audio/vocab/experience.mp3",
      },
      {
        lessonId: lesson1.id,
        word: "skills",
        meaning: "kỹ năng",
        example: "My technical skills include React and Node.js.",
        audioUrl: "/audio/vocab/skills.mp3",
      },
      {
        lessonId: lesson2.id,
        word: "deadline",
        meaning: "hạn chót",
        example: "We need to meet the project deadline.",
        audioUrl: "/audio/vocab/deadline.mp3",
      },
      {
        lessonId: lesson2.id,
        word: "requirements",
        meaning: "yêu cầu",
        example: "The client changed the requirements again.",
        audioUrl: "/audio/vocab/requirements.mp3",
      },
    ],
  });

  console.log("✅ Vocabulary created");

  // Create grammar points
  await prisma.grammarPoint.createMany({
    data: [
      {
        lessonId: lesson1.id,
        point: "Present Perfect for Experience",
        explanation:
          'Sử dụng Present Perfect để nói về kinh nghiệm: "I have worked..." thay vì "I worked..."',
      },
      {
        lessonId: lesson1.id,
        point: "Modal Verbs for Ability",
        explanation:
          'Sử dụng "can", "am able to" để nói về khả năng: "I can develop web applications"',
      },
      {
        lessonId: lesson2.id,
        point: "Future Tense for Planning",
        explanation:
          'Sử dụng "will", "going to", "plan to" để nói về kế hoạch dự án',
      },
    ],
  });

  console.log("✅ Grammar points created");

  // Create sample exercise
  const exercise1 = await prisma.exercise.create({
    data: {
      lessonId: lesson1.id,
      type: "cloze",
      difficulty: "medium",
      tenantId: defaultTenant.id,
      createdBy: adminUser.id,
      status: "published",
    },
  });

  // Create sample quiz
  const quiz1 = await prisma.quiz.create({
    data: {
      lessonId: lesson1.id,
      title: "Quiz: Giới thiệu bản thân",
      tenantId: defaultTenant.id,
      createdBy: adminUser.id,
      status: "published",
    },
  });

  // Create questions
  const question1 = await prisma.question.create({
    data: {
      exerciseId: exercise1.id,
      stem: "Cách nào đúng để nói về kinh nghiệm làm việc?",
      type: "MCQ",
      tenantId: defaultTenant.id,
    },
  });

  // Create choices
  await prisma.choice.createMany({
    data: [
      {
        questionId: question1.id,
        text: "I worked as a developer for 3 years.",
        isCorrect: false,
      },
      {
        questionId: question1.id,
        text: "I have worked as a developer for 3 years.",
        isCorrect: true,
      },
      {
        questionId: question1.id,
        text: "I am working as a developer for 3 years.",
        isCorrect: false,
      },
    ],
  });

  console.log("✅ Quiz created");

  // Create sample audio files
  await prisma.audio.createMany({
    data: [
      {
        storyId: story1.id,
        storageKey: "stories/story1_original.mp3",
        voiceType: "original",
        durationSec: 120,
        tenantId: defaultTenant.id,
        createdBy: adminUser.id,
        status: "published",
      },
      {
        lessonId: lesson1.id,
        storageKey: "lessons/lesson1_vocab.mp3",
        voiceType: "vocab",
        durationSec: 60,
        tenantId: defaultTenant.id,
        createdBy: adminUser.id,
        status: "published",
      },
    ],
  });

  console.log("✅ Audio files created");

  // Create sample user progress
  const vocab1 = await prisma.vocabulary.findFirst({
    where: { word: "interview" },
  });

  const vocab2 = await prisma.vocabulary.findFirst({
    where: { word: "experience" },
  });

  if (vocab1 && vocab2) {
    await prisma.userVocabularyProgress.createMany({
      data: [
        {
          userId: student1.id,
          vocabularyId: vocab1.id,
          status: "reviewing",
          lastReviewed: new Date(),
        },
        {
          userId: student1.id,
          vocabularyId: vocab2.id,
          status: "mastered",
          lastReviewed: new Date(),
        },
      ],
    });
  }

  console.log("✅ User progress created");

  // Create sample user results
  await prisma.userResult.create({
    data: {
      userId: student1.id,
      lessonId: lesson1.id,
      score: 85.5,
      startedAt: new Date(),
      finishedAt: new Date(),
    },
  });

  console.log("✅ User results created");

  // Create sample feedback
  await prisma.feedback.create({
    data: {
      userId: student1.id,
      lessonId: lesson1.id,
      content:
        "Bài học rất hay, phương pháp truyện chêm giúp tôi nhớ từ vựng dễ hơn!",
      rate: 5,
    },
  });

  console.log("✅ Feedback created");

  // Create sample reflection
  await prisma.reflection.create({
    data: {
      lessonId: lesson1.id,
      userId: student1.id,
      content: `Tôi đã tạo lại cuộc hội thoại:
      "Good morning! I'm excited to be here for the developer position. 
      I have been working in software development for 3 years, 
      specializing in React and Node.js. I'm passionate about creating 
      user-friendly applications and solving complex problems."`,
    },
  });

  console.log("✅ Reflection created");

  console.log("🎉 Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`- Tenants: ${await prisma.tenant.count()}`);
  console.log(`- Users: ${await prisma.user.count()}`);
  console.log(`- Courses: ${await prisma.course.count()}`);
  console.log(`- Units: ${await prisma.unit.count()}`);
  console.log(`- Lessons: ${await prisma.lesson.count()}`);
  console.log(`- Stories: ${await prisma.story.count()}`);
  console.log(`- Vocabulary: ${await prisma.vocabulary.count()}`);
  console.log(`- Quizzes: ${await prisma.quiz.count()}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
