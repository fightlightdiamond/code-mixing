import { ChunkType } from "@/features/stories/hooks";

export interface GeneratedChunk {
  chunkText: string;
  type: ChunkType;
}

/**
 * Generate story chunks from a block of content.
 * English words (ASCII letters) are marked as `chem` chunks,
 * while surrounding Vietnamese text becomes `normal` chunks.
 *
 * Example:
 *   "Hôm nay tôi có một interview quan trọng" =>
 *   [
 *     { chunkText: "Hôm nay tôi có một", type: "normal" },
 *     { chunkText: "interview", type: "chem" },
 *     { chunkText: "quan trọng", type: "normal" }
 *   ]
 */
export function generateStoryChunks(content: string): GeneratedChunk[] {
  const parts = content.split(/([A-Za-z]+)/);
  const chunks: GeneratedChunk[] = [];

  for (const part of parts) {
    const text = part.trim();
    if (!text) continue;

    const type: ChunkType = /^[A-Za-z]+$/.test(text) ? "chem" : "normal";
    chunks.push({ chunkText: text, type });
  }

  return chunks;
}

export function calculateStoryStats(chunks: GeneratedChunk[]): {
  wordCount: number;
  chemRatio: number;
} {
  const totalWords = chunks.reduce(
    (sum, chunk) => sum + chunk.chunkText.split(/\s+/).filter(Boolean).length,
    0
  );
  const chemWords = chunks.reduce(
    (sum, c) =>
      sum + (c.type === "chem" ? c.chunkText.split(/\s+/).filter(Boolean).length : 0),
    0
  );
  const chemRatio = totalWords > 0 ? chemWords / totalWords : 0;

  return { wordCount: totalWords, chemRatio };
}

