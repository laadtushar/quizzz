import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/middleware'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const reorderSchema = z.object({
  questions: z.array(
    z.object({
      questionId: z.string().uuid(),
      orderIndex: z.number().int().min(0),
    })
  ),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAdmin()
    const body = await request.json()
    const validatedData = reorderSchema.parse(body)

    // Verify all questions belong to this quiz
    const questionIds = validatedData.questions.map((q) => q.questionId)
    const questions = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
        quizId: params.id,
      },
      select: { id: true },
    })

    if (questions.length !== questionIds.length) {
      return NextResponse.json(
        { error: 'Some questions do not belong to this quiz' },
        { status: 400 }
      )
    }

    // Update all questions in a transaction
    await prisma.$transaction(
      validatedData.questions.map((q) =>
        prisma.question.update({
          where: { id: q.questionId },
          data: { orderIndex: q.orderIndex },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      )
    }
    console.error('Reorder questions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

