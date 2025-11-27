import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, getCurrentUser } from '@/lib/auth/middleware'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    // Users can only see their own attempts, admins can see all
    if (currentUser.role !== 'admin' && attempt.userId !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ attempt })
  } catch (error) {
    console.error('Get attempt error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { answers } = body

    const attempt = await prisma.attempt.findUnique({
      where: { id: params.id },
    })

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (attempt.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (attempt.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Cannot update completed attempt' },
        { status: 400 }
      )
    }

    const updatedAttempt = await prisma.attempt.update({
      where: { id: params.id },
      data: {
        answers: answers || attempt.answers,
      },
    })

    return NextResponse.json({ attempt: updatedAttempt })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Update attempt error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

