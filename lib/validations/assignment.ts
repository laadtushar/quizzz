import { z } from 'zod'

export const createAssignmentSchema = z.object({
  quizId: z.string().uuid(),
  userIds: z.array(z.string().uuid()).min(1),
  dueDate: z.string().datetime().optional().nullable(),
  message: z.string().optional(),
})

export const updateAssignmentSchema = z.object({
  dueDate: z.string().datetime().optional().nullable(),
  status: z.enum(['pending', 'completed', 'overdue']).optional(),
})

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>

