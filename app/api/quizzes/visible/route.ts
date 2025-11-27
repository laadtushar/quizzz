import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const difficulty = searchParams.get('difficulty')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)

    const where: any = {
      visibility: 'visible',
      status: 'published',
    }

    if (difficulty) {
      where.settingsDifficultyLevel = difficulty
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      }
    }

    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
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
    console.error('Get visible quizzes error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

