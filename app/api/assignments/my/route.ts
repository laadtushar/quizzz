import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const assignments = await prisma.assignment.findMany({
      where: {
        assignedTo: user.id,
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            description: true,
            questionCount: true,
            settingsDifficultyLevel: true,
            settingsTimerSeconds: true,
          },
        },
        assigner: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { assignedAt: 'desc' },
      ],
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get my assignments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

