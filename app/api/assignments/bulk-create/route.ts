import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/middleware'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const bulkCreateSchema = z.object({
  assignments: z.array(
    z.object({
      quizId: z.string().uuid(),
      userId: z.string().uuid(),
      dueDate: z.string().datetime().nullable().optional(),
    })
  ),
})

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    const body = await request.json()
    const validatedData = bulkCreateSchema.parse(body)

    // Verify all quizzes and users exist
    const quizIds = [...new Set(validatedData.assignments.map((a) => a.quizId))]
    const userIds = [...new Set(validatedData.assignments.map((a) => a.userId))]

    const quizzes = await prisma.quiz.findMany({
      where: { id: { in: quizIds } },
      select: { id: true },
    })

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true },
    })

    if (quizzes.length !== quizIds.length) {
      return NextResponse.json(
        { error: 'Some quizzes were not found' },
        { status: 404 }
      )
    }

    if (users.length !== userIds.length) {
      return NextResponse.json(
        { error: 'Some users were not found' },
        { status: 404 }
      )
    }

    // Check for duplicate assignments
    const existingAssignments = await prisma.assignment.findMany({
      where: {
        OR: validatedData.assignments.map((a) => ({
          quizId: a.quizId,
          assignedTo: a.userId,
        })),
      },
      select: {
        quizId: true,
        assignedTo: true,
      },
    })

    const existingSet = new Set(
      existingAssignments.map((a) => `${a.quizId}-${a.assignedTo}`)
    )

    // Filter out duplicates
    const newAssignments = validatedData.assignments.filter(
      (a) => !existingSet.has(`${a.quizId}-${a.userId}`)
    )

    if (newAssignments.length === 0) {
      return NextResponse.json(
        { error: 'All assignments already exist', duplicates: validatedData.assignments.length },
        { status: 400 }
      )
    }

    // Create assignments in a transaction
    const created = await prisma.$transaction(
      newAssignments.map((a) =>
        prisma.assignment.create({
          data: {
            quizId: a.quizId,
            assignedTo: a.userId,
            assignedBy: user.id,
            dueDate: a.dueDate ? new Date(a.dueDate) : null,
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      created: created.length,
      duplicates: validatedData.assignments.length - newAssignments.length,
      assignments: created,
    })
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
    console.error('Bulk create assignments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

