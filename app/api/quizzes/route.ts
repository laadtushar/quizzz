import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { requireAdmin } from '@/lib/auth/middleware'
import { createQuizSchema } from '@/lib/validations/quiz'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const visibility = searchParams.get('visibility')

    const where: any = {}
    if (status) {
      where.status = status
    }
    if (visibility) {
      where.visibility = visibility
    }

    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ quizzes })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Get quizzes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    const body = await request.json()
    const validatedData = createQuizSchema.parse(body)

    const quiz = await prisma.quiz.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        createdBy: user.id,
        visibility: validatedData.visibility,
        status: validatedData.status,
        tags: validatedData.tags,
        settingsTimerSeconds: validatedData.settings.timerSeconds,
        settingsAllowRetries: validatedData.settings.allowRetries,
        settingsDifficultyLevel: validatedData.settings.difficultyLevel,
        settingsPassingScore: validatedData.settings.passingScore,
        questionCount: validatedData.questions?.length || 0,
        totalPoints: validatedData.questions?.reduce((sum, q) => sum + q.points, 0) || 0,
        questions: validatedData.questions
          ? {
              create: validatedData.questions.map((q) => ({
                orderIndex: q.orderIndex,
                type: q.type,
                questionText: q.questionText,
                points: q.points,
                options: q.options ? q.options : Prisma.JsonNull,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                imageUrl: q.imageUrl,
              })),
            }
          : undefined,
      },
      include: {
        questions: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    })

    return NextResponse.json({ quiz }, { status: 201 })
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
    console.error('Create quiz error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

