import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'
import { z } from 'zod'

const selfAssignSchema = z.object({
  quizId: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const validatedData = selfAssignSchema.parse(body)

    // Verify quiz exists and is published
    const quiz = await prisma.quiz.findUnique({
      where: { id: validatedData.quizId },
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    if (quiz.status !== 'published') {
      return NextResponse.json(
        { error: 'Can only assign published quizzes' },
        { status: 400 }
      )
    }

    // Check if already assigned
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        quizId: validatedData.quizId,
        assignedTo: user.id,
      },
    })

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Quiz already assigned to you' },
        { status: 400 }
      )
    }

    // Create self-assignment
    const assignment = await prisma.assignment.create({
      data: {
        quizId: validatedData.quizId,
        assignedTo: user.id,
        assignedBy: user.id, // Self-assigned
        status: 'pending',
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      )
    }
    console.error('Self-assign error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

