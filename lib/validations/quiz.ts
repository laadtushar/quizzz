import { z } from 'zod'

export const questionOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  isCorrect: z.boolean(),
})

export const questionSchema = z.object({
  orderIndex: z.number().int().min(0),
  type: z.enum(['mcq', 'true_false', 'ordering', 'fill_blank', 'multiple_select']),
  questionText: z.string().min(1),
  points: z.number().int().min(1).default(10),
  options: z.array(questionOptionSchema).optional(),
  correctAnswer: z.any(), // JSONB - varies by type
  explanation: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
})

export const quizSettingsSchema = z.object({
  timerSeconds: z.number().int().positive().optional().nullable(),
  allowRetries: z.boolean().default(true),
  difficultyLevel: z.enum(['easy', 'medium', 'hard']).default('medium'),
  passingScore: z.number().min(0).max(100).optional().nullable(),
})

export const createQuizSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  visibility: z.enum(['visible', 'hidden']).default('visible'),
  status: z.enum(['draft', 'published']).default('draft'),
  tags: z.array(z.string()).default([]),
  settings: quizSettingsSchema,
  questions: z.array(questionSchema).optional(),
})

export const updateQuizSchema = createQuizSchema.partial()

export const createQuestionSchema = questionSchema.omit({ orderIndex: true })

export const updateQuestionSchema = questionSchema.partial()

export type CreateQuizInput = z.infer<typeof createQuizSchema>
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>
export type QuestionInput = z.infer<typeof questionSchema>
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>
export type QuizSettings = z.infer<typeof quizSettingsSchema>

