import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/middleware'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAdmin()

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        questions: true,
      },
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    if (quiz.questions.length === 0) {
      return NextResponse.json(
        { error: 'Cannot publish quiz without questions' },
        { status: 400 }
      )
    }

    const updatedQuiz = await prisma.quiz.update({
      where: { id: params.id },
      data: {
        status: 'published',
      },
    })

    return NextResponse.json({ quiz: updatedQuiz })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Publish quiz error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

