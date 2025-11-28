import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/middleware'

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
            title: true,
          },
        },
        user: {
          select: {
            displayName: true,
            email: true,
          },
        },
        assigner: {
          select: {
            displayName: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    })

    // Generate CSV
    const headers = [
      'Quiz Title',
      'Assigned To',
      'Email',
      'Assigned By',
      'Status',
      'Assigned Date',
      'Due Date',
      'Completed Date',
      'Score (%)',
    ]

    const rows = assignments.map((assignment) => [
      assignment.quiz.title,
      assignment.user.displayName,
      assignment.user.email,
      assignment.assigner.displayName,
      assignment.status,
      assignment.assignedAt.toISOString().split('T')[0],
      assignment.dueDate ? assignment.dueDate.toISOString().split('T')[0] : '',
      assignment.completedAt
        ? assignment.completedAt.toISOString().split('T')[0]
        : '',
      assignment.score ? Number(assignment.score).toFixed(2) : '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="assignments-${Date.now()}.csv"`,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Export assignments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

