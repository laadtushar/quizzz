import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request
    const authHeader = headers().get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const results = {
      overdueUpdated: 0,
      attemptsAbandoned: 0,
    }

    // 1. Update overdue assignments
    const overdueResult = await prisma.assignment.updateMany({
      where: {
        status: 'pending',
        dueDate: {
          lt: now,
        },
      },
      data: {
        status: 'overdue',
      },
    })
    results.overdueUpdated = overdueResult.count

    // 2. Cleanup incomplete attempts (older than 7 days)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 7) // 7 days ago

    const cleanupResult = await prisma.attempt.updateMany({
      where: {
        status: 'in_progress',
        startedAt: {
          lt: cutoffDate,
        },
      },
      data: {
        status: 'abandoned',
      },
    })
    results.attemptsAbandoned = cleanupResult.count

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    console.error('Daily maintenance error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

