import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/middleware'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAdmin()

    // Get the original quiz with questions
    const originalQuiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    })

    if (!originalQuiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Create duplicate quiz with all questions in a transaction
    const duplicatedQuiz = await prisma.$transaction(async (tx) => {
      // Create new quiz
      const newQuiz = await tx.quiz.create({
        data: {
          title: `${originalQuiz.title} (Copy)`,
          description: originalQuiz.description,
          createdBy: user.id,
          visibility: originalQuiz.visibility,
          status: 'draft',
          questionCount: originalQuiz.questionCount,
          totalPoints: originalQuiz.totalPoints,
          tags: originalQuiz.tags,
          settingsTimerSeconds: originalQuiz.settingsTimerSeconds,
          settingsAllowRetries: originalQuiz.settingsAllowRetries,
          settingsDifficultyLevel: originalQuiz.settingsDifficultyLevel,
          settingsPassingScore: originalQuiz.settingsPassingScore,
        },
      })

      // Duplicate all questions
      if (originalQuiz.questions.length > 0) {
        await tx.question.createMany({
          data: originalQuiz.questions.map((q) => ({
            quizId: newQuiz.id,
            orderIndex: q.orderIndex,
            type: q.type,
            questionText: q.questionText,
            points: q.points,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            imageUrl: q.imageUrl,
          })),
        })
      }

      return newQuiz
    })

    return NextResponse.json({
      quiz: duplicatedQuiz,
      message: 'Quiz duplicated successfully',
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Duplicate quiz error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

