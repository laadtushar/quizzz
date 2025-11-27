import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Get user stats
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        totalXp: true,
        quizzesCompleted: true,
      },
    })

    // Get rank
    const usersAbove = await prisma.user.count({
      where: {
        OR: [
          { totalXp: { gt: userData?.totalXp || 0 } },
          {
            AND: [
              { totalXp: userData?.totalXp || 0 },
              { quizzesCompleted: { gt: userData?.quizzesCompleted || 0 } },
            ],
          },
        ],
      },
    })
    const rank = usersAbove + 1

    // Get attempts for stats
    const attempts = await prisma.attempt.findMany({
      where: {
        userId: user.id,
        status: 'completed',
      },
      select: {
        percentage: true,
        timeSpent: true,
        completedAt: true,
        quiz: {
          select: {
            settingsDifficultyLevel: true,
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    })

    const totalTimeSpent = attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0)
    const averageScore = attempts.length > 0
      ? attempts.reduce((sum, a) => sum + Number(a.percentage || 0), 0) / attempts.length
      : 0

    // Calculate performance by difficulty
    const difficultyStats = {
      easy: { count: 0, avgScore: 0 },
      medium: { count: 0, avgScore: 0 },
      hard: { count: 0, avgScore: 0 },
    }

    attempts.forEach((attempt) => {
      const difficulty = attempt.quiz.settingsDifficultyLevel
      if (difficultyStats[difficulty as keyof typeof difficultyStats]) {
        difficultyStats[difficulty as keyof typeof difficultyStats].count++
        const currentAvg = difficultyStats[difficulty as keyof typeof difficultyStats].avgScore
        const score = Number(attempt.percentage || 0)
        difficultyStats[difficulty as keyof typeof difficultyStats].avgScore =
          (currentAvg * (difficultyStats[difficulty as keyof typeof difficultyStats].count - 1) + score) /
          difficultyStats[difficulty as keyof typeof difficultyStats].count
      }
    })

    return NextResponse.json({
      totalXp: userData?.totalXp || 0,
      rank,
      quizzesCompleted: userData?.quizzesCompleted || 0,
      averageScore: Math.round(averageScore * 100) / 100,
      totalTimeSpent,
      difficultyStats,
      recentAttempts: attempts.slice(0, 10).map((a) => ({
        percentage: Number(a.percentage || 0),
        completedAt: a.completedAt,
        difficulty: a.quiz.settingsDifficultyLevel,
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get user stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

