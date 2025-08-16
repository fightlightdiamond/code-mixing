import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import logger from "@/lib/logger";

const schema = z.object({
  word: z.string(),
  status: z.enum(["learning", "mastered"]),
  storyId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const data = schema.parse(await request.json());
    // In a real implementation, this would persist to the database.
    return NextResponse.json({ word: data.word, status: data.status });
  } catch (error) {
    logger.error("Error updating vocabulary progress", error);
    return NextResponse.json(
      { error: "Failed to update vocabulary progress" },
      { status: 500 }
    );
  }
}
