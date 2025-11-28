import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/middleware'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const bulkDeleteSchema = z.object({
  quizIds: z.array(z.string().uuid()).min(1, 'At least one quiz must be selected'),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    const body = await request.json()
    const validatedData = bulkDeleteSchema.parse(body)

    // Verify all quizzes exist and belong to the admin (optional: check ownership)
    const quizzes = await prisma.quiz.findMany({
      where: {
        id: { in: validatedData.quizIds },
      },
      select: { id: true },
    })

    if (quizzes.length !== validatedData.quizIds.length) {
      return NextResponse.json(
        { error: 'Some quizzes were not found' },
        { status: 404 }
      )
    }

    // Delete all quizzes in a transaction
    await prisma.quiz.deleteMany({
      where: {
        id: { in: validatedData.quizIds },
      },
    })

    return NextResponse.json({
      success: true,
      deletedCount: validatedData.quizIds.length,
    })
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
    console.error('Bulk delete quizzes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

