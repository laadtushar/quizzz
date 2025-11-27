import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin()

    // Total users
    const totalUsers = await prisma.user.count()

    // Total quizzes
    const totalQuizzes = await prisma.quiz.count({
      where: { status: 'published' },
    })

    // Total attempts
    const totalAttempts = await prisma.attempt.count({
      where: { status: 'completed' },
    })

    // Average score
    const attempts = await prisma.attempt.findMany({
      where: { status: 'completed' },
      select: { percentage: true },
    })
    const averageScore =
      attempts.length > 0
        ? attempts.reduce((sum, a) => sum + Number(a.percentage || 0), 0) / attempts.length
        : 0

    // Completion rate
    const assignments = await prisma.assignment.count()
    const completedAssignments = await prisma.assignment.count({
      where: { status: 'completed' },
    })
    const completionRate =
      assignments > 0 ? (completedAssignments / assignments) * 100 : 0

    // Recent activity
    const recentAttempts = await prisma.attempt.findMany({
      where: { status: 'completed' },
      orderBy: { completedAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            displayName: true,
          },
        },
        quiz: {
          select: {
            title: true,
          },
        },
      },
    })

    // Quiz performance
    const quizPerformance = await prisma.quiz.findMany({
      where: { status: 'published' },
      include: {
        _count: {
          select: {
            attempts: true,
          },
        },
        attempts: {
          where: { status: 'completed' },
          select: {
            percentage: true,
          },
        },
      },
    })

    const quizStats = quizPerformance.map((quiz) => {
      const avgScore =
        quiz.attempts.length > 0
          ? quiz.attempts.reduce((sum, a) => sum + Number(a.percentage || 0), 0) /
            quiz.attempts.length
          : 0
      return {
        id: quiz.id,
        title: quiz.title,
        attempts: quiz._count.attempts,
        averageScore: Math.round(avgScore * 100) / 100,
      }
    })

    return NextResponse.json({
      totalUsers,
      totalQuizzes,
      totalAttempts,
      averageScore: Math.round(averageScore * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
      recentAttempts: recentAttempts.map((a) => ({
        id: a.id,
        userName: a.user.displayName,
        quizTitle: a.quiz.title,
        score: Number(a.percentage || 0),
        completedAt: a.completedAt,
      })),
      quizStats,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Get analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

