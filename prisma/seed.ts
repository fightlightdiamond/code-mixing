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
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@edtech.com" },
    update: {},
    create: {
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
  const coachUser = await prisma.user.upsert({
    where: { email: "coach@edtech.com" },
    update: {},
    create: {
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
  const student1 = await prisma.user.upsert({
    where: { email: "student1@edtech.com" },
    update: {},
    create: {
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

  const student2 = await prisma.user.upsert({
    where: { email: "student2@edtech.com" },
    update: {},
    create: {
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

  // ===== IAM: Permissions, Roles, Assignments, Policies =====
  console.log("🌱 Seeding IAM (Permissions, Roles, Assignments, Policies)...");

  // Seed permissions (resource x action)
  const resources = [
    "User",
    "Role",
    "Permission",
    "ResourcePolicy",
    "Course",
    "Unit",
    "Lesson",
    "Story",
    "Quiz",
    "QuizResult",
    "Audio",
    "Tag",
  ];
  const actions = ["create", "read", "update", "delete"] as const;

  const permissionRows = resources.flatMap((res) =>
    actions.map((act) => ({
      name: `${act} ${res}`,
      slug: `${res.toLowerCase()}:${act}`,
      resource: res,
      action: act,
      isSystem: true,
    }))
  );

  await prisma.permission.createMany({ data: permissionRows, skipDuplicates: true });

  const allPermissions = await prisma.permission.findMany();
  const bySlug = new Map(allPermissions.map((p) => [p.slug, p]));

  // Seed roles
  await prisma.role.createMany({
    data: [
      { name: "Administrator", slug: "admin", tenantScope: "system", isSystem: true },
      { name: "Editor", slug: "editor", tenantScope: null, isSystem: false },
      { name: "Viewer", slug: "viewer", tenantScope: null, isSystem: false },
    ],
    skipDuplicates: true,
  });

  const adminRole = await prisma.role.findFirst({ where: { slug: "admin" } });
  const editorRole = await prisma.role.findFirst({ where: { slug: "editor" } });
  const viewerRole = await prisma.role.findFirst({ where: { slug: "viewer" } });

  if (!adminRole || !editorRole || !viewerRole) {
    throw new Error("Failed to seed base roles");
  }

  // Assign permissions to roles
  const assignRolePerm = async (roleSlug: string, permissionSlugs: string[]) => {
    const role = await prisma.role.findFirst({ where: { slug: roleSlug } });
    if (!role) return;

    for (const slug of permissionSlugs) {
      const perm = bySlug.get(slug);
      if (!perm) continue;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: perm.id,
          },
        },
        create: {
          roleId: role.id,
          permissionId: perm.id,
        },
        update: {},
      });
    }
  };

  // Admin gets all permissions
  await assignRolePerm(
    "admin",
    allPermissions.map((p) => p.slug)
  );

  // Editor: CRUD on content entities; read users/roles/permissions
  const editorSlugs = [
    // content CRUD
    "course:create", "course:read", "course:update",
    "unit:create", "unit:read", "unit:update",
    "lesson:create", "lesson:read", "lesson:update",
    "story:create", "story:read", "story:update",
    "quiz:create", "quiz:read", "quiz:update",
    "audio:create", "audio:read", "audio:update",
    "tag:create", "tag:read", "tag:update",
    // limited reads
    "user:read", "role:read", "permission:read", "resourcepolicy:read",
  ];
  await assignRolePerm("editor", editorSlugs.filter((s) => bySlug.has(s)));
  await assignRolePerm("editor", editorSlugs.filter((s) => bySlug.has(s)));

  // Viewer: read-only across most entities
  await assignRolePerm("viewer", [
    "story:read",
    "lesson:read",
    "user:read",
  ]);

  // Assign admin user to admin role
  try {
    await prisma.userToRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });
  } catch (error) {
    // Ignore duplicate entries
    console.log('Admin role assignment already exists');
  }

  // Assign coach user to editor role
  try {
    await prisma.userToRole.create({
      data: {
        userId: coachUser.id,
        roleId: editorRole.id,
      },
    });
  } catch (error) {
    console.log('Coach editor role assignment already exists');
  }

  // Assign students to viewer role
  try {
    await prisma.userToRole.create({
      data: {
        userId: student1.id,
        roleId: viewerRole.id,
      },
    });
  } catch (error) {
    console.log('Student1 viewer role assignment already exists');
  }

  try {
    await prisma.userToRole.create({
      data: {
        userId: student2.id,
        roleId: viewerRole.id,
      },
    });
  } catch (error) {
    console.log('Student2 viewer role assignment already exists');
  }

  // Sample deny-first policy: deny delete Story if not admin
  await prisma.resourcePolicy.create({
    data: {
      name: "Deny delete Story for non-admin",
      resource: "Story",
      effect: "deny",
      priority: 100,
      isActive: true,
      conditions: {
        // Example CASL-like condition shape to deny when user lacks admin role
        // Your guard should interpret tenant/roles accordingly
        notRoles: ["admin"],
        action: "delete",
      },
    },
  }).catch(() => void 0);

  console.log("✅ IAM seeded");

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
  });
