import { z } from 'zod'

export const createAssignmentSchema = z.object({
  quizId: z.string().uuid(),
  userIds: z.array(z.string().uuid()).min(1),
  dueDate: z
    .union([z.string(), z.null()])
    .optional()
    .refine(
      (val) => {
        if (!val || val === '' || val === null) return true // Optional field
        // Accept ISO datetime or datetime-local format
        const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d{3})?(Z|[+-]\d{2}:\d{2})?$/
        const localRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
        if (typeof val === 'string') {
          return isoRegex.test(val) || localRegex.test(val) || !isNaN(Date.parse(val))
        }
        return true
      },
      { message: 'Invalid datetime format' }
    ),
  message: z.string().optional(),
})

export const updateAssignmentSchema = z.object({
  dueDate: z.string().datetime().optional().nullable(),
  status: z.enum(['pending', 'completed', 'overdue']).optional(),
})

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>

