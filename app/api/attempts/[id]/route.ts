import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, getCurrentUser, requireAdmin } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attempt = await prisma.attempt.findUnique({
      where: { id: params.id },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: {
                orderIndex: 'asc',
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    // Users can only see their own attempts, admins can see all
    if (currentUser.role !== 'admin' && attempt.userId !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // For non-admin users, only show correct answers if the attempt is completed
    // This prevents users from seeing answers while taking the quiz
    if (currentUser.role !== 'admin' && attempt.status !== 'completed') {
      const sanitizedAttempt = {
        ...attempt,
        quiz: {
          ...attempt.quiz,
          questions: attempt.quiz.questions.map((q: any) => {
            const { correctAnswer, explanation, options, ...questionWithoutAnswer } = q
            // For MCQ and multiple select, remove isCorrect flags from options
            let sanitizedOptions = options
            if (Array.isArray(options)) {
              sanitizedOptions = options.map((opt: any) => {
                const { isCorrect, ...optionWithoutCorrect } = opt
                return optionWithoutCorrect
              })
            }
            return {
              ...questionWithoutAnswer,
              options: sanitizedOptions,
            }
          }),
        },
      }
      return NextResponse.json({ attempt: sanitizedAttempt })
    }

    return NextResponse.json({ attempt })
  } catch (error) {
    console.error('Get attempt error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { answers } = body

    const attempt = await prisma.attempt.findUnique({
      where: { id: params.id },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (attempt.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (attempt.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Cannot update completed attempt' },
        { status: 400 }
      )
    }

    const updatedAttempt = await prisma.attempt.update({
      where: { id: params.id },
      data: {
        answers: answers || attempt.answers,
      },
    })

    return NextResponse.json({ attempt: updatedAttempt })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Update attempt error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/attempts/[id] - Delete an attempt (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin()

    const attempt = await prisma.attempt.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
        quiz: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    // Delete the attempt (cascade will handle related data)
    await prisma.attempt.delete({
      where: { id: params.id },
    })

    // If the attempt was completed, we need to update user stats
    if (attempt.status === 'completed') {
      // Recalculate user stats correctly:
      // - XP: Sum of latest attempt's XP for each unique quiz
      // - quizzesCompleted: Count of unique quizzes completed
      const allUserAttempts = await prisma.attempt.findMany({
        where: {
          userId: attempt.userId,
          status: 'completed',
        },
        select: {
          quizId: true,
          xpAwarded: true,
          completedAt: true,
        },
        orderBy: {
          completedAt: 'desc',
        },
      })

      // Get latest attempt for each quiz (for XP calculation)
      const latestAttemptsByQuiz = new Map<string, number>()
      for (const userAttempt of allUserAttempts) {
        if (!latestAttemptsByQuiz.has(userAttempt.quizId)) {
          latestAttemptsByQuiz.set(userAttempt.quizId, userAttempt.xpAwarded || 0)
        }
      }

      // Calculate total XP from latest attempts only
      const totalXp = Array.from(latestAttemptsByQuiz.values()).reduce(
        (sum, xp) => sum + xp,
        0
      )

      // Count unique quizzes completed
      const uniqueQuizIds = new Set(allUserAttempts.map((a) => a.quizId))
      const quizzesCompleted = uniqueQuizIds.size

      await prisma.user.update({
        where: { id: attempt.userId },
        data: {
          totalXp,
          quizzesCompleted,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Attempt deleted successfully',
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Delete attempt error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/attempts/[id]/reset - Reset an attempt (admin only)
 * Resets a completed attempt back to in_progress, allowing the user to retake it
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin()
    const body = await request.json()
    const { action } = body

    if (action !== 'reset') {
      return NextResponse.json(
        { error: 'Invalid action. Use { "action": "reset" }' },
        { status: 400 }
      )
    }

    const attempt = await prisma.attempt.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
          },
        },
        quiz: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (attempt.status !== 'completed') {
      return NextResponse.json(
        { error: 'Can only reset completed attempts' },
        { status: 400 }
      )
    }

    // Reset the attempt
    const resetAttempt = await prisma.$transaction(async (tx) => {
      // Reset attempt to in_progress
      const updatedAttempt = await tx.attempt.update({
        where: { id: params.id },
        data: {
          status: 'in_progress',
          completedAt: null,
          score: 0,
          percentage: null,
          isPassed: false,
          xpAwarded: null,
          timeSpent: null,
          answers: [],
        },
      })

      // Recalculate user stats after reset
      // Get all remaining completed attempts
      const remainingAttempts = await tx.attempt.findMany({
        where: {
          userId: attempt.userId,
          status: 'completed',
        },
        select: {
          quizId: true,
          xpAwarded: true,
          completedAt: true,
        },
        orderBy: {
          completedAt: 'desc',
        },
      })

      // Get latest attempt for each quiz (for XP calculation)
      const latestAttemptsByQuiz = new Map<string, number>()
      for (const userAttempt of remainingAttempts) {
        if (!latestAttemptsByQuiz.has(userAttempt.quizId)) {
          latestAttemptsByQuiz.set(userAttempt.quizId, userAttempt.xpAwarded || 0)
        }
      }

      // Calculate total XP from latest attempts only
      const totalXp = Array.from(latestAttemptsByQuiz.values()).reduce(
        (sum, xp) => sum + xp,
        0
      )

      // Count unique quizzes completed
      const uniqueQuizIds = new Set(remainingAttempts.map((a) => a.quizId))
      const quizzesCompleted = uniqueQuizIds.size

      await tx.user.update({
        where: { id: attempt.userId },
        data: {
          totalXp,
          quizzesCompleted,
        },
      })

      // Update assignment if it was marked as completed
      const assignment = await tx.assignment.findFirst({
        where: {
          quizId: attempt.quizId,
          assignedTo: attempt.userId,
          status: 'completed',
        },
      })

      if (assignment) {
        await tx.assignment.update({
          where: { id: assignment.id },
          data: {
            status: 'pending',
            completedAt: null,
            score: null,
          },
        })
      }

      return updatedAttempt
    })

    return NextResponse.json({
      success: true,
      message: 'Attempt reset successfully',
      attempt: resetAttempt,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Reset attempt error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

