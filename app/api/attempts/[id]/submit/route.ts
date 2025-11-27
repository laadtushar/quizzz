import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'
import { scoreAttempt, calculateXP } from '@/lib/quiz/scoring'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { answers, timeSpent } = body

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
      },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (attempt.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (attempt.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Attempt already completed' },
        { status: 400 }
      )
    }

    // Score the attempt - cast questions to match expected type
    const scoredAnswers = scoreAttempt(attempt.quiz.questions as any, answers)
    const totalScore = scoredAnswers.reduce((sum, a) => sum + a.pointsEarned, 0)
    const percentage = (totalScore / attempt.maxScore) * 100
    const passingScore = attempt.quiz.settingsPassingScore
      ? Number(attempt.quiz.settingsPassingScore)
      : 60
    const isPassed = percentage >= passingScore

    // Check if this is the first attempt
    const previousAttempts = await prisma.attempt.count({
      where: {
        userId: user.id,
        quizId: attempt.quizId,
        status: 'completed',
      },
    })
    const isFirstAttempt = previousAttempts === 0

    // Calculate XP
    const xpAwarded = calculateXP(
      attempt.quiz.questionCount,
      attempt.quiz.settingsDifficultyLevel,
      isPassed,
      percentage,
      isFirstAttempt
    )

    // Update attempt and user stats in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update attempt
      const updatedAttempt = await tx.attempt.update({
        where: { id: params.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          score: totalScore,
          percentage,
          timeSpent: timeSpent || null,
          xpAwarded,
          isPassed,
          answers: scoredAnswers as any,
        },
      })

      // Update user stats
      await tx.user.update({
        where: { id: user.id },
        data: {
          totalXp: { increment: xpAwarded },
          quizzesCompleted: { increment: 1 },
        },
      })

      // Update assignment if exists
      const assignment = await tx.assignment.findFirst({
        where: {
          quizId: attempt.quizId,
          assignedTo: user.id,
          status: 'pending',
        },
      })

      if (assignment) {
        await tx.assignment.update({
          where: { id: assignment.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            score: percentage,
          },
        })
      }

      return updatedAttempt
    })

    return NextResponse.json({
      attempt: result,
      score: totalScore,
      maxScore: attempt.maxScore,
      percentage,
      isPassed,
      xpAwarded,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Submit attempt error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

