/**
 * Spaced Repetition Algorithm for Vocabulary Learning
 * Based on the SuperMemo SM-2 algorithm with modifications for language learning
 */

export interface SpacedRepetitionData {
  word: string;
  easeFactor: number; // 1.3 - 2.5, default 2.5
  interval: number; // Days until next review
  repetitions: number; // Number of successful repetitions
  lastReviewed: Date;
  nextReview: Date;
  quality: number; // Last response quality (0-5)
}

export interface ReviewResult {
  word: string;
  quality: number; // 0-5 (0: complete blackout, 5: perfect response)
  responseTime: number; // Time taken to respond in seconds
  isCorrect: boolean;
}

/**
 * Calculate the next review date and update spaced repetition data
 */
export function calculateNextReview(
  data: SpacedRepetitionData,
  result: ReviewResult
): SpacedRepetitionData {
  const { quality } = result;
  let { easeFactor, interval, repetitions } = data;

  // Update ease factor based on quality
  if (quality >= 3) {
    // Correct response
    easeFactor = Math.max(
      1.3,
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }

    repetitions += 1;
  } else {
    // Incorrect response - reset repetitions but keep some progress
    repetitions = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  }

  // Apply response time modifier
  const responseTimeModifier = calculateResponseTimeModifier(
    result.responseTime
  );
  interval = Math.max(1, Math.round(interval * responseTimeModifier));

  const now = new Date();
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    ...data,
    easeFactor,
    interval,
    repetitions,
    lastReviewed: now,
    nextReview,
    quality,
  };
}

/**
 * Calculate response time modifier
 * Fast responses get bonus, slow responses get penalty
 */
function calculateResponseTimeModifier(responseTime: number): number {
  // Optimal response time is around 3-5 seconds
  const optimalTime = 4;
  const maxPenalty = 0.8; // 20% penalty for very slow responses
  const maxBonus = 1.2; // 20% bonus for very fast responses

  if (responseTime <= optimalTime) {
    // Fast response - give bonus
    const bonus = ((optimalTime - responseTime) / optimalTime) * 0.2;
    return Math.min(maxBonus, 1 + bonus);
  } else {
    // Slow response - apply penalty
    const penalty = Math.min(0.2, ((responseTime - optimalTime) / 10) * 0.2);
    return Math.max(maxPenalty, 1 - penalty);
  }
}

/**
 * Initialize spaced repetition data for a new word
 */
export function initializeSpacedRepetition(word: string): SpacedRepetitionData {
  const now = new Date();
  return {
    word,
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    lastReviewed: now,
    nextReview: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
    quality: 0,
  };
}

/**
 * Get words due for review
 */
export function getWordsForReview(
  vocabularyData: SpacedRepetitionData[],
  maxWords: number = 20
): SpacedRepetitionData[] {
  const now = new Date();

  return vocabularyData
    .filter((data) => data.nextReview <= now)
    .sort((a, b) => {
      // Prioritize overdue words
      const aOverdue = now.getTime() - a.nextReview.getTime();
      const bOverdue = now.getTime() - b.nextReview.getTime();

      if (aOverdue !== bOverdue) {
        return bOverdue - aOverdue; // More overdue first
      }

      // Then by ease factor (harder words first)
      return a.easeFactor - b.easeFactor;
    })
    .slice(0, maxWords);
}

/**
 * Calculate mastery level based on spaced repetition data
 */
export function calculateMasteryLevel(data: SpacedRepetitionData): number {
  const { repetitions, easeFactor, interval, quality } = data;

  // Base mastery from repetitions (0-60%)
  const repetitionScore = Math.min(60, repetitions * 10);

  // Ease factor contribution (0-20%)
  const easeScore = ((easeFactor - 1.3) / (2.5 - 1.3)) * 20;

  // Interval contribution (0-15%)
  const intervalScore = Math.min(15, Math.log(interval + 1) * 3);

  // Recent quality contribution (0-5%)
  const qualityScore = quality;

  return Math.min(
    100,
    Math.round(repetitionScore + easeScore + intervalScore + qualityScore)
  );
}

/**
 * Determine vocabulary status based on mastery level and repetitions
 */
export function getVocabularyStatus(
  data: SpacedRepetitionData
): "new" | "reviewing" | "mastered" {
  const masteryLevel = calculateMasteryLevel(data);

  if (data.repetitions === 0) {
    return "new";
  } else if (masteryLevel >= 85 && data.repetitions >= 5) {
    return "mastered";
  } else {
    return "reviewing";
  }
}

/**
 * Generate review suggestions based on forgetting curve
 */
export function generateReviewSuggestions(
  vocabularyData: SpacedRepetitionData[],
  targetReviewsPerDay: number = 10
): {
  urgent: SpacedRepetitionData[];
  due: SpacedRepetitionData[];
  upcoming: SpacedRepetitionData[];
} {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const urgent: SpacedRepetitionData[] = [];
  const due: SpacedRepetitionData[] = [];
  const upcoming: SpacedRepetitionData[] = [];

  vocabularyData.forEach((data) => {
    const daysSinceReview =
      (now.getTime() - data.lastReviewed.getTime()) / (24 * 60 * 60 * 1000);
    const daysUntilReview =
      (data.nextReview.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);

    if (daysUntilReview < -1) {
      // More than 1 day overdue
      urgent.push(data);
    } else if (daysUntilReview <= 0) {
      // Due today or yesterday
      due.push(data);
    } else if (daysUntilReview <= 1) {
      // Due tomorrow
      upcoming.push(data);
    }
  });

  // Sort by priority
  urgent.sort((a, b) => a.nextReview.getTime() - b.nextReview.getTime());
  due.sort((a, b) => a.easeFactor - b.easeFactor); // Harder words first
  upcoming.sort((a, b) => a.nextReview.getTime() - b.nextReview.getTime());

  return {
    urgent: urgent.slice(0, Math.ceil(targetReviewsPerDay * 0.4)),
    due: due.slice(0, Math.ceil(targetReviewsPerDay * 0.4)),
    upcoming: upcoming.slice(0, Math.ceil(targetReviewsPerDay * 0.2)),
  };
}

/**
 * Calculate optimal study session length based on vocabulary data
 */
export function calculateOptimalSessionLength(
  vocabularyData: SpacedRepetitionData[]
): {
  recommendedWords: number;
  estimatedMinutes: number;
  difficulty: "easy" | "medium" | "hard";
} {
  const wordsForReview = getWordsForReview(vocabularyData);
  const averageEaseFactor =
    wordsForReview.reduce((sum, data) => sum + data.easeFactor, 0) /
      wordsForReview.length || 2.5;

  // Estimate time per word based on difficulty
  const timePerWord =
    averageEaseFactor < 2.0 ? 45 : averageEaseFactor < 2.3 ? 30 : 20; // seconds

  const recommendedWords = Math.min(20, Math.max(5, wordsForReview.length));
  const estimatedMinutes = Math.ceil((recommendedWords * timePerWord) / 60);

  let difficulty: "easy" | "medium" | "hard" = "medium";
  if (averageEaseFactor < 2.0) difficulty = "hard";
  else if (averageEaseFactor > 2.3) difficulty = "easy";

  return {
    recommendedWords,
    estimatedMinutes,
    difficulty,
  };
}
