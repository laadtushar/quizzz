import { z } from 'zod'

const questionOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  isCorrect: z.boolean().optional(),
})

const questionSchema = z.object({
  type: z.enum(['mcq', 'multiple_select', 'true_false', 'ordering', 'fill_blank']),
  questionText: z.string().min(1),
  points: z.number().int().min(1).default(10),
  options: z.array(questionOptionSchema).optional(),
  correctAnswer: z.any(),
  explanation: z.string().optional(),
})

export const quizGenerationResponseSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  questions: z.array(questionSchema).min(1),
})

export function validateAIResponse(data: any, expectedCount: number): {
  valid: boolean
  questions?: any[]
  title?: string
  description?: string
  error?: string
} {
  try {
    const parsed = quizGenerationResponseSchema.parse(data)

    if (parsed.questions.length !== expectedCount) {
      return {
        valid: false,
        error: `Expected ${expectedCount} questions, got ${parsed.questions.length}`,
      }
    }

    // Validate each question
    for (const question of parsed.questions) {
      // MCQ and multiple-select must have options
      if (['mcq', 'multiple_select'].includes(question.type)) {
        if (!question.options || question.options.length < 2) {
          return {
            valid: false,
            error: `Question "${question.questionText}" must have at least 2 options`,
          }
        }

        // MCQ must have exactly one correct answer
        if (question.type === 'mcq') {
          const correctCount = question.options.filter((o) => o.isCorrect).length
          if (correctCount !== 1) {
            return {
              valid: false,
              error: `MCQ question "${question.questionText}" must have exactly one correct answer`,
            }
          }
        }

        // Multiple-select must have at least one correct answer
        if (question.type === 'multiple_select') {
          const correctCount = question.options.filter((o) => o.isCorrect).length
          if (correctCount < 1) {
            return {
              valid: false,
              error: `Multiple-select question "${question.questionText}" must have at least one correct answer`,
            }
          }
        }
      }

      // Ordering must have options
      if (question.type === 'ordering') {
        if (!question.options || question.options.length < 2) {
          return {
            valid: false,
            error: `Ordering question "${question.questionText}" must have at least 2 items`,
          }
        }
      }

      // True/False must have boolean correctAnswer
      if (question.type === 'true_false') {
        if (typeof question.correctAnswer !== 'boolean') {
          return {
            valid: false,
            error: `True/False question "${question.questionText}" must have boolean correctAnswer`,
          }
        }
      }
    }

    return {
      valid: true,
      questions: parsed.questions,
      title: parsed.title,
      description: parsed.description,
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid response format',
    }
  }
}

