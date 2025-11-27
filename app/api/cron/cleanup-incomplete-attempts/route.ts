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

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 7) // 7 days ago

    // Mark old incomplete attempts as abandoned
    const result = await prisma.attempt.updateMany({
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

    return NextResponse.json({
      success: true,
      abandoned: result.count,
    })
  } catch (error) {
    console.error('Cleanup incomplete attempts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

