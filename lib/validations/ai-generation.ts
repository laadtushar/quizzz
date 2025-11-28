import { z } from 'zod'

export const generateQuizSchema = z.object({
  inputText: z.string().min(100, 'Input text must be at least 100 characters').max(1000000, 'Input text too long (max 1,000,000 characters)'),
  questionCount: z.number().int().min(5).max(50),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionTypes: z.array(z.enum(['mcq', 'multiple_select', 'true_false', 'ordering', 'fill_blank'])).min(1),
  title: z.string().optional(),
  description: z.string().optional(),
})

export type GenerateQuizInput = z.infer<typeof generateQuizSchema>


