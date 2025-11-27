import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, getCurrentUser } from '@/lib/auth/middleware'
import { updateQuizSchema } from '@/lib/validations/quiz'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
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

    // Non-admins can only see visible quizzes
    if (currentUser.role !== 'admin' && quiz.visibility !== 'visible') {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    return NextResponse.json({ quiz })
  } catch (error) {
    console.error('Get quiz error:', error)
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
    const user = await requireAdmin()
    const body = await request.json()
    const validatedData = updateQuizSchema.parse(body)

    const updateData: any = {}
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.visibility !== undefined) updateData.visibility = validatedData.visibility
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags
    
    // Handle settings - support both nested and flat structure
    if (validatedData.settings) {
      if (validatedData.settings.timerSeconds !== undefined) {
        updateData.settingsTimerSeconds = validatedData.settings.timerSeconds
      }
      if (validatedData.settings.allowRetries !== undefined) {
        updateData.settingsAllowRetries = validatedData.settings.allowRetries
      }
      if (validatedData.settings.difficultyLevel !== undefined) {
        updateData.settingsDifficultyLevel = validatedData.settings.difficultyLevel
      }
      if (validatedData.settings.passingScore !== undefined) {
        updateData.settingsPassingScore = validatedData.settings.passingScore
      }
    }
    
    // Also support flat structure (for direct updates from form)
    if (validatedData.settingsTimerSeconds !== undefined) {
      updateData.settingsTimerSeconds = validatedData.settingsTimerSeconds
    }
    if (validatedData.settingsAllowRetries !== undefined) {
      updateData.settingsAllowRetries = validatedData.settingsAllowRetries
    }
    if (validatedData.settingsDifficultyLevel !== undefined) {
      updateData.settingsDifficultyLevel = validatedData.settingsDifficultyLevel
    }
    if (validatedData.settingsPassingScore !== undefined) {
      updateData.settingsPassingScore = validatedData.settingsPassingScore
    }

    const quiz = await prisma.quiz.update({
      where: { id: params.id },
      data: updateData,
      include: {
        questions: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    })

    return NextResponse.json({ quiz })
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
    console.error('Update quiz error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAdmin()

    await prisma.quiz.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Delete quiz error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

