import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    const attempts = await prisma.attempt.findMany({
      where: {
        userId: user.id,
        quizId: params.id,
      },
      orderBy: {
        startedAt: 'desc',
      },
      select: {
        id: true,
        status: true,
        percentage: true,
        completedAt: true,
      },
    })

    return NextResponse.json({ attempts })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get attempts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    if (quiz.status !== 'published') {
      return NextResponse.json(
        { error: 'Quiz is not published' },
        { status: 400 }
      )
    }

    if (quiz.visibility !== 'visible') {
      return NextResponse.json(
        { error: 'Quiz is not visible' },
        { status: 400 }
      )
    }

    // Check if retries are allowed and max attempts limit
    if (!quiz.settingsAllowRetries) {
      const existingAttempt = await prisma.attempt.findFirst({
        where: {
          userId: user.id,
          quizId: params.id,
          status: 'completed',
        },
      })

      if (existingAttempt) {
        return NextResponse.json(
          { error: 'Retries are not allowed for this quiz' },
          { status: 400 }
        )
      }
    } else if (quiz.settingsMaxAttempts !== null && quiz.settingsMaxAttempts !== undefined) {
      // Check if user has reached max attempts
      const completedAttempts = await prisma.attempt.count({
        where: {
          userId: user.id,
          quizId: params.id,
          status: 'completed',
        },
      })

      if (completedAttempts >= quiz.settingsMaxAttempts) {
        return NextResponse.json(
          { 
            error: `Maximum attempts (${quiz.settingsMaxAttempts}) reached for this quiz` 
          },
          { status: 400 }
        )
      }
    }

    // Check for existing in-progress attempt
    const inProgressAttempt = await prisma.attempt.findFirst({
      where: {
        userId: user.id,
        quizId: params.id,
        status: 'in_progress',
      },
    })

    if (inProgressAttempt) {
      return NextResponse.json({ attempt: inProgressAttempt })
    }

    // Create new attempt
    const attempt = await prisma.attempt.create({
      data: {
        userId: user.id,
        quizId: params.id,
        maxScore: quiz.totalPoints,
        answers: [],
      },
    })

    return NextResponse.json({ attempt }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Start attempt error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
