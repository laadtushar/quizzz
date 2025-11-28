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
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get all users with their attempts to calculate total scores
    const users = await prisma.user.findMany({
      select: {
        id: true,
        displayName: true,
        email: true,
        totalXp: true,
        quizzesCompleted: true,
        avatarUrl: true,
        attempts: {
          where: {
            status: 'completed',
          },
          select: {
            score: true,
            percentage: true,
          },
        },
      },
    })

    // Calculate total scores and average percentage for each user
    const leaderboardData = users.map((user) => {
      const totalScore = user.attempts.reduce((sum, attempt) => sum + Number(attempt.score || 0), 0)
      const totalPercentage = user.attempts.reduce((sum, attempt) => sum + Number(attempt.percentage || 0), 0)
      const averagePercentage = user.attempts.length > 0 ? totalPercentage / user.attempts.length : 0

      return {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        totalXp: user.totalXp,
        quizzesCompleted: user.quizzesCompleted,
        avatarUrl: user.avatarUrl,
        totalScore,
        averagePercentage: Math.round(averagePercentage * 100) / 100,
      }
    })

    // Sort by combined score: XP (weighted 40%) + Total Score (weighted 40%) + Average Percentage (weighted 20%)
    // Normalize values to 0-100 scale for fair comparison
    const maxXp = Math.max(...leaderboardData.map((u) => u.totalXp), 1)
    const maxScore = Math.max(...leaderboardData.map((u) => u.totalScore), 1)

    leaderboardData.sort((a, b) => {
      // Normalize to 0-100 scale
      const normalizedXpA = (a.totalXp / maxXp) * 100
      const normalizedXpB = (b.totalXp / maxXp) * 100
      const normalizedScoreA = (a.totalScore / maxScore) * 100
      const normalizedScoreB = (b.totalScore / maxScore) * 100

      // Combined score with weights
      const combinedScoreA = normalizedXpA * 0.4 + normalizedScoreA * 0.4 + a.averagePercentage * 0.2
      const combinedScoreB = normalizedXpB * 0.4 + normalizedScoreB * 0.4 + b.averagePercentage * 0.2

      if (combinedScoreB !== combinedScoreA) {
        return combinedScoreB - combinedScoreA
      }

      // Tie-breakers
      if (b.totalXp !== a.totalXp) {
        return b.totalXp - a.totalXp
      }
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore
      }
      if (b.quizzesCompleted !== a.quizzesCompleted) {
        return b.quizzesCompleted - a.quizzesCompleted
      }
      return a.displayName.localeCompare(b.displayName)
    })

    // Add rank and take limit
    const leaderboardWithRank = leaderboardData.slice(0, limit).map((user, index) => ({
      ...user,
      rank: index + 1,
    }))

    return NextResponse.json({
      leaderboard: leaderboardWithRank,
      currentUserId: user.id,
    })
  } catch (error) {
    console.error('Get leaderboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

