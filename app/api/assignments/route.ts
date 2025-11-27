import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/middleware'
import { createAssignmentSchema } from '@/lib/validations/assignment'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin()
    const { searchParams } = new URL(request.url)
    const quizId = searchParams.get('quizId')
    const assignedTo = searchParams.get('assignedTo')
    const status = searchParams.get('status')

    const where: any = {}
    if (quizId) where.quizId = quizId
    if (assignedTo) where.assignedTo = assignedTo
    if (status) where.status = status

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
        assigner: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Get assignments error:', error)
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
    const validatedData = createAssignmentSchema.parse(body)

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

    // Verify users exist
    const users = await prisma.user.findMany({
      where: {
        id: { in: validatedData.userIds },
      },
    })

    if (users.length !== validatedData.userIds.length) {
      return NextResponse.json(
        { error: 'Some users not found' },
        { status: 400 }
      )
    }

    // Create assignments (avoid duplicates)
    const assignments = await prisma.$transaction(async (tx) => {
      const results = []
      for (const userId of validatedData.userIds) {
        // Check if assignment already exists
        const existing = await tx.assignment.findFirst({
          where: {
            quizId: validatedData.quizId,
            assignedTo: userId,
          },
        })

        if (existing) {
          // Update existing assignment
          results.push(
            await tx.assignment.update({
              where: { id: existing.id },
              data: {
                dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
                status: 'pending',
                reminderSent: false,
              },
            })
          )
        } else {
          // Create new assignment
          results.push(
            await tx.assignment.create({
              data: {
                quizId: validatedData.quizId,
                assignedTo: userId,
                assignedBy: user.id,
                dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
                status: 'pending',
              },
            })
          )
        }
      }
      return results
    })

    return NextResponse.json({ assignments }, { status: 201 })
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
    console.error('Create assignment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

