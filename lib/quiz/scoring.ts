import { QuestionType } from '@prisma/client'
import { isSimilarAnswerWithVariations } from '@/lib/utils/text-similarity'

interface Question {
  id: string
  type: QuestionType
  points: number
  correctAnswer: any
  options?: Array<{ id: string; text: string; isCorrect: boolean }> | null
}

interface UserAnswer {
  questionId: string
  userAnswer: any
  timeSpent?: number
}

export interface ScoredAnswer {
  questionId: string
  userAnswer: any
  isCorrect: boolean
  pointsEarned: number
  timeSpent?: number
}

export function scoreQuestion(question: Question, userAnswer: any): boolean {
  switch (question.type) {
    case 'mcq':
      return userAnswer === question.correctAnswer

    case 'true_false':
      // Handle both boolean and string representations
      // Convert string "true"/"false" to boolean if needed
      let userBool: boolean
      if (typeof userAnswer === 'string') {
        userBool = userAnswer.toLowerCase() === 'true'
      } else {
        userBool = Boolean(userAnswer)
      }
      
      const correctBool = Boolean(question.correctAnswer)
      return userBool === correctBool

    case 'multiple_select':
      if (!Array.isArray(userAnswer) || !Array.isArray(question.correctAnswer)) {
        return false
      }
      const userSet = new Set(userAnswer.sort())
      const correctSet = new Set(question.correctAnswer.sort())
      return userSet.size === correctSet.size && 
             Array.from(userSet).every(id => correctSet.has(id))

    case 'ordering':
      if (!Array.isArray(userAnswer) || !Array.isArray(question.correctAnswer)) {
        return false
      }
      return JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer)

    case 'fill_blank':
      // Use similarity-based evaluation to handle variations like singular/plural, stop words, etc.
      return isSimilarAnswerWithVariations(
        String(userAnswer || ''),
        String(question.correctAnswer || ''),
        0.80 // 80% similarity threshold (handles stop words like "and", "or", etc.)
      )

    default:
      return false
  }
}

export function scoreAttempt(
  questions: Question[],
  answers: UserAnswer[]
): ScoredAnswer[] {
  const scoredAnswers: ScoredAnswer[] = []

  for (const answer of answers) {
    const question = questions.find((q) => q.id === answer.questionId)
    if (!question) {
      continue
    }

    const isCorrect = scoreQuestion(question, answer.userAnswer)
    const pointsEarned = isCorrect ? question.points : 0

    scoredAnswers.push({
      questionId: answer.questionId,
      userAnswer: answer.userAnswer,
      isCorrect,
      pointsEarned,
      timeSpent: answer.timeSpent,
    })
  }

  return scoredAnswers
}

export function calculateXP(
  questionsCount: number,
  difficultyLevel: string,
  isPassed: boolean,
  percentage: number,
  isFirstAttempt: boolean
): number {
  const baseXP = questionsCount * 10

  const difficultyMultiplier = {
    easy: 1,
    medium: 1.5,
    hard: 2,
  }[difficultyLevel] || 1

  const passingBonus = isPassed ? 1.5 : 1

  const perfectScoreBonus = percentage === 100 ? 1.25 : 1

  const firstAttemptBonus = isFirstAttempt ? 1.1 : 1

  return Math.round(
    baseXP *
      difficultyMultiplier *
      passingBonus *
      perfectScoreBonus *
      firstAttemptBonus
  )
}


