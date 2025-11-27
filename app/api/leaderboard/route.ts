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
    const limit = parseInt(searchParams.get('limit') || '50')

    const leaderboard = await prisma.user.findMany({
      select: {
        id: true,
        displayName: true,
        email: true,
        totalXp: true,
        quizzesCompleted: true,
        avatarUrl: true,
      },
      orderBy: [
        { totalXp: 'desc' },
        { quizzesCompleted: 'desc' },
        { displayName: 'asc' },
      ],
      take: limit,
    })

    // Add rank
    const leaderboardWithRank = leaderboard.map((user, index) => ({
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

