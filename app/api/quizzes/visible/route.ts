import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const difficulty = searchParams.get('difficulty')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'newest'
    const completionStatus = searchParams.get('completionStatus') // 'completed', 'not-completed', 'all'

    const where: any = {
      visibility: 'visible',
      status: 'published',
    }

    // Debug: Check all quizzes to see what we have
    const allQuizzes = await prisma.quiz.findMany({
      select: {
        id: true,
        title: true,
        visibility: true,
        status: true,
      },
    })
    console.log('All quizzes in database:', JSON.stringify(allQuizzes, null, 2))
    console.log('Fetching visible quizzes with where clause:', JSON.stringify(where, null, 2))

    if (difficulty && difficulty !== 'all') {
      where.settingsDifficultyLevel = difficulty
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    let orderBy: any = { createdAt: 'desc' }
    if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' }
    } else if (sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' }
    } else if (sortBy === 'title') {
      orderBy = { title: 'asc' }
    } else if (sortBy === 'popular') {
      orderBy = { attempts: { _count: 'desc' } }
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
        attempts: {
          where: {
            status: 'completed',
            userId: user.id,
          },
          select: {
            id: true,
            percentage: true,
            completedAt: true,
          },
          orderBy: {
            completedAt: 'desc',
          },
          take: 1, // Get the latest attempt
        },
      },
      orderBy,
    })

    console.log(`Found ${quizzes.length} published quizzes`)

    // Calculate average scores and filter by completion status
    const quizzesWithStats = await Promise.all(
      quizzes.map(async (quiz) => {
        const userAttempts = quiz.attempts || []
        
        // Get all completed attempts for average score
        const allAttempts = await prisma.attempt.findMany({
          where: {
            quizId: quiz.id,
            status: 'completed',
          },
          select: {
            percentage: true,
          },
        })
        
        const averageScore =
          allAttempts.length > 0
            ? allAttempts.reduce((sum, a) => sum + Number(a.percentage || 0), 0) / allAttempts.length
            : null

        const isCompleted = userAttempts.length > 0
        const userBestScore = userAttempts.length > 0
          ? Math.max(...userAttempts.map((a) => Number(a.percentage || 0)))
          : null
        const latestAttemptId = userAttempts.length > 0 ? userAttempts[0].id : null

        return {
          ...quiz,
          averageScore: averageScore ? Math.round(averageScore * 100) / 100 : null,
          isCompleted,
          userBestScore,
          latestAttemptId,
          estimatedTime: quiz.settingsTimerSeconds
            ? Math.floor(quiz.settingsTimerSeconds / 60)
            : null,
        }
      })
    )

    // Filter by completion status
    let filteredQuizzes = quizzesWithStats
    if (completionStatus === 'completed') {
      filteredQuizzes = quizzesWithStats.filter((q) => q.isCompleted)
    } else if (completionStatus === 'not-completed') {
      filteredQuizzes = quizzesWithStats.filter((q) => !q.isCompleted)
    }

    // Remove internal fields
    const cleanedQuizzes = filteredQuizzes.map(({ attempts, ...quiz }) => quiz)

    console.log(`Returning ${cleanedQuizzes.length} quizzes after filtering`)

    return NextResponse.json({ quizzes: cleanedQuizzes })
  } catch (error) {
    console.error('Get visible quizzes error:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

