import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { requireAdmin } from '@/lib/auth/middleware'
import { createQuestionSchema, updateQuestionSchema } from '@/lib/validations/quiz'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAdmin()
    const body = await request.json()
    const validatedData = createQuestionSchema.parse(body)

    // Get current max order index
    const maxOrder = await prisma.question.findFirst({
      where: { quizId: params.id },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    })

    const orderIndex = (maxOrder?.orderIndex ?? -1) + 1

    const question = await prisma.question.create({
      data: {
        quizId: params.id,
        orderIndex,
        type: validatedData.type,
        questionText: validatedData.questionText,
        points: validatedData.points,
        options: validatedData.options ? validatedData.options : Prisma.JsonNull,
        correctAnswer: validatedData.correctAnswer ? validatedData.correctAnswer : Prisma.JsonNull,
        explanation: validatedData.explanation,
        imageUrl: validatedData.imageUrl,
      },
    })

    // Update quiz question count and total points
    await prisma.quiz.update({
      where: { id: params.id },
      data: {
        questionCount: { increment: 1 },
        totalPoints: { increment: validatedData.points },
      },
    })

    return NextResponse.json({ question }, { status: 201 })
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
    console.error('Create question error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAdmin()

    const questions = await prisma.question.findMany({
      where: { quizId: params.id },
      orderBy: { orderIndex: 'asc' },
    })

    return NextResponse.json({ questions })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Get questions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

