import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { requireAdmin } from '@/lib/auth/middleware'
import { updateQuestionSchema } from '@/lib/validations/quiz'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const user = await requireAdmin()
    const body = await request.json()
    const validatedData = updateQuestionSchema.parse(body)

    const oldQuestion = await prisma.question.findUnique({
      where: { id: params.questionId },
      select: { points: true },
    })

    if (!oldQuestion) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (validatedData.type !== undefined) updateData.type = validatedData.type
    if (validatedData.questionText !== undefined) updateData.questionText = validatedData.questionText
    if (validatedData.points !== undefined) updateData.points = validatedData.points
    if (validatedData.options !== undefined) {
      updateData.options = validatedData.options ? validatedData.options : Prisma.JsonNull
    }
    if (validatedData.correctAnswer !== undefined) {
      updateData.correctAnswer = validatedData.correctAnswer ? validatedData.correctAnswer : Prisma.JsonNull
    }
    if (validatedData.explanation !== undefined) updateData.explanation = validatedData.explanation
    if (validatedData.imageUrl !== undefined) updateData.imageUrl = validatedData.imageUrl
    if (validatedData.orderIndex !== undefined) updateData.orderIndex = validatedData.orderIndex

    const question = await prisma.question.update({
      where: { id: params.questionId },
      data: updateData,
    })

    // Update quiz total points if points changed
    if (validatedData.points !== undefined && validatedData.points !== oldQuestion.points) {
      const pointsDiff = validatedData.points - oldQuestion.points
      await prisma.quiz.update({
        where: { id: params.id },
        data: {
          totalPoints: { increment: pointsDiff },
        },
      })
    }

    return NextResponse.json({ question })
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
    console.error('Update question error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const user = await requireAdmin()

    const question = await prisma.question.findUnique({
      where: { id: params.questionId },
      select: { points: true },
    })

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    await prisma.question.delete({
      where: { id: params.questionId },
    })

    // Update quiz question count and total points
    await prisma.quiz.update({
      where: { id: params.id },
      data: {
        questionCount: { decrement: 1 },
        totalPoints: { decrement: question.points },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Delete question error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

