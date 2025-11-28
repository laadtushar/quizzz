/**
 * Text similarity utilities for evaluating fill-in-the-blank answers
 * Handles variations like singular/plural, case differences, spacing, etc.
 */

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s]/g, '') // Remove punctuation
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) {
    dp[i][0] = i
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        )
      }
    }
  }

  return dp[m][n]
}

/**
 * Calculate similarity ratio between two strings (0-1)
 * 1.0 = identical, 0.0 = completely different
 */
function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeText(str1)
  const normalized2 = normalizeText(str2)

  // Exact match after normalization
  if (normalized1 === normalized2) {
    return 1.0
  }

  // Calculate Levenshtein distance
  const distance = levenshteinDistance(normalized1, normalized2)
  const maxLength = Math.max(normalized1.length, normalized2.length)

  if (maxLength === 0) {
    return 1.0
  }

  // Similarity ratio (1 - normalized distance)
  return 1 - distance / maxLength
}

/**
 * Check if two strings are similar enough to be considered correct
 * @param userAnswer - The user's answer
 * @param correctAnswer - The correct answer
 * @param threshold - Similarity threshold (0-1), default 0.85
 * @returns true if similar enough, false otherwise
 */
export function isSimilarAnswer(
  userAnswer: string,
  correctAnswer: string,
  threshold: number = 0.85
): boolean {
  if (!userAnswer || !correctAnswer) {
    return false
  }

  const similarity = calculateSimilarity(userAnswer, correctAnswer)
  return similarity >= threshold
}

/**
 * Get similarity score between two strings (0-1)
 * Useful for displaying how close the answer was
 */
export function getSimilarityScore(userAnswer: string, correctAnswer: string): number {
  if (!userAnswer || !correctAnswer) {
    return 0
  }
  return calculateSimilarity(userAnswer, correctAnswer)
}

/**
 * Check for common variations (singular/plural, common misspellings)
 * This is a helper that can be extended for domain-specific variations
 */
function checkCommonVariations(userAnswer: string, correctAnswer: string): boolean {
  const normalizedUser = normalizeText(userAnswer)
  const normalizedCorrect = normalizeText(correctAnswer)

  // Check if one is singular and the other is plural
  const singularPluralPairs = [
    // Common English plural patterns
    { singular: /^(.+?)(s|es|ies)$/, plural: /^(.+?)$/ },
  ]

  // Simple check: if one ends with 's' and the other doesn't, check if removing 's' makes them match
  if (normalizedUser.endsWith('s') && !normalizedCorrect.endsWith('s')) {
    if (normalizedUser.slice(0, -1) === normalizedCorrect) {
      return true
    }
  }
  if (normalizedCorrect.endsWith('s') && !normalizedUser.endsWith('s')) {
    if (normalizedCorrect.slice(0, -1) === normalizedUser) {
      return true
    }
  }

  // Check for 'ies' -> 'y' pattern (cities -> city)
  if (normalizedUser.endsWith('ies') && normalizedCorrect.endsWith('y')) {
    if (normalizedUser.slice(0, -3) === normalizedCorrect.slice(0, -1)) {
      return true
    }
  }
  if (normalizedCorrect.endsWith('ies') && normalizedUser.endsWith('y')) {
    if (normalizedCorrect.slice(0, -3) === normalizedUser.slice(0, -1)) {
      return true
    }
  }

  return false
}

/**
 * Enhanced similarity check that includes common variations
 */
export function isSimilarAnswerWithVariations(
  userAnswer: string,
  correctAnswer: string,
  threshold: number = 0.85
): boolean {
  // First check exact match
  if (normalizeText(userAnswer) === normalizeText(correctAnswer)) {
    return true
  }

  // Check common variations (singular/plural)
  if (checkCommonVariations(userAnswer, correctAnswer)) {
    return true
  }

  // Check similarity score
  return isSimilarAnswer(userAnswer, correctAnswer, threshold)
}

