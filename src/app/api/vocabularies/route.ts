import { Prisma, LearningLevel } from "@prisma/client";
import { prisma } from "@/core/prisma"; // Đường dẫn tới Prisma instance của bạn
import { NextRequest, NextResponse } from "next/server";

export async function getVocabularies(params: {
  search?: string;
  level?: LearningLevel;
}) {
  const { search, level } = params;

  // Dùng type Prisma thay vì any để được gợi ý và kiểm tra type
  const where: Prisma.VocabularyWhereInput = {};

  // Search theo từ hoặc nghĩa
  if (search) {
    where.OR = [
      { word: { contains: search, mode: "insensitive" } },
      { meaning: { contains: search, mode: "insensitive" } },
    ];
  }

  // Lọc theo level của Course (thông qua Lesson → Course)
  if (level) {
    where.lesson = {
      course: {
        level: { equals: level },
      },
    };
  }

  // Query
  const vocabularies = await prisma.vocabulary.findMany({
    where,
    include: {
      lesson: {
        select: {
          id: true,
          title: true,
          course: {
            select: {
              id: true,
              title: true,
              level: true, // Lấy level từ Course
            },
          },
        },
      },
    },
    orderBy: {
      word: "asc",
    },
    take: 100,
  });

  return vocabularies;
}

// GET handler for /api/vocabularies
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const level = searchParams.get("level") as LearningLevel || undefined;

    const vocabularies = await getVocabularies({ search, level });

    return NextResponse.json(vocabularies);
  } catch (error) {
    console.error("Error fetching vocabularies:", error);
    return NextResponse.json(
      { error: "Failed to fetch vocabularies" },
      { status: 500 }
    );
  }
}
