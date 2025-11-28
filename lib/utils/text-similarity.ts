/**
 * Text similarity utilities for evaluating fill-in-the-blank answers
 * Handles variations like singular/plural, case differences, spacing, stop words, etc.
 * Uses industry-standard similarity algorithms (Jaccard similarity + Levenshtein distance)
 */

/**
 * Common English stop words to ignore in comparison
 */
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'will', 'with', 'or', 'but', 'not', 'so', 'than',
  'this', 'these', 'those', 'they', 'them', 'their', 'there'
])

/**
 * Normalize text for comparison - removes stop words, punctuation, extra spaces
 */
function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s]/g, '') // Remove punctuation
}

/**
 * Tokenize text into words, removing stop words
 */
function tokenize(text: string): string[] {
  const normalized = normalizeText(text)
  return normalized
    .split(/\s+/)
    .filter(word => word.length > 0 && !STOP_WORDS.has(word))
}

/**
 * Calculate Jaccard similarity (intersection over union of word sets)
 * This is industry-standard for text similarity
 */
function jaccardSimilarity(str1: string, str2: string): number {
  const tokens1 = new Set(tokenize(str1))
  const tokens2 = new Set(tokenize(str2))

  if (tokens1.size === 0 && tokens2.size === 0) {
    return 1.0
  }

  if (tokens1.size === 0 || tokens2.size === 0) {
    return 0.0
  }

  // Calculate intersection
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)))
  
  // Calculate union
  const union = new Set([...tokens1, ...tokens2])

  return intersection.size / union.size
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
 * Uses combined approach: Jaccard similarity (word-based) + Levenshtein (character-based)
 * This is more industry-standard and handles stop words, word order, etc.
 */
function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeText(str1)
  const normalized2 = normalizeText(str2)

  // Exact match after normalization
  if (normalized1 === normalized2) {
    return 1.0
  }

  // Calculate Jaccard similarity (word-based, handles stop words and word order)
  const jaccard = jaccardSimilarity(str1, str2)

  // Calculate Levenshtein similarity (character-based, handles typos)
  const distance = levenshteinDistance(normalized1, normalized2)
  const maxLength = Math.max(normalized1.length, normalized2.length)
  const levenshtein = maxLength === 0 ? 1.0 : 1 - distance / maxLength

  // Combined similarity: 60% Jaccard (word-based) + 40% Levenshtein (character-based)
  // This gives more weight to word matching, which is better for handling stop words
  return (jaccard * 0.6) + (levenshtein * 0.4)
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
 * Uses industry-standard Jaccard similarity + Levenshtein distance
 * Handles stop words, word order, singular/plural, typos, etc.
 */
export function isSimilarAnswerWithVariations(
  userAnswer: string,
  correctAnswer: string,
  threshold: number = 0.75 // Lowered to 75% to be more lenient with variations
): boolean {
  if (!userAnswer || !correctAnswer) {
    return false
  }

  // Trim whitespace
  const trimmedUser = userAnswer.trim()
  const trimmedCorrect = correctAnswer.trim()

  // First check exact match after normalization (removes stop words, punctuation, case)
  const tokens1 = tokenize(trimmedUser)
  const tokens2 = tokenize(trimmedCorrect)
  
  if (tokens1.length === 0 && tokens2.length === 0) {
    return true
  }

  // If both tokenize to the same set of words, it's a match (handles stop words and word order)
  if (tokens1.length > 0 && tokens2.length > 0) {
    const set1 = new Set(tokens1)
    const set2 = new Set(tokens2)
    // Check if all tokens match (handles word order differences)
    if (set1.size === set2.size && [...set1].every(x => set2.has(x))) {
      return true
    }
    
    // Also check if one set is a subset of the other (for cases like "port adapter" vs "ports and adapter")
    // If all tokens from the smaller set are in the larger set, consider it a match
    const smallerSet = set1.size <= set2.size ? set1 : set2
    const largerSet = set1.size <= set2.size ? set2 : set1
    if ([...smallerSet].every(x => largerSet.has(x))) {
      // Only accept if the difference is small (e.g., singular/plural)
      const sizeDiff = Math.abs(set1.size - set2.size)
      if (sizeDiff <= 1) {
        return true
      }
    }
  }

  // Check common variations (singular/plural)
  if (checkCommonVariations(trimmedUser, trimmedCorrect)) {
    return true
  }

  // Check similarity score (Jaccard + Levenshtein combined)
  return isSimilarAnswer(trimmedUser, trimmedCorrect, threshold)
}

