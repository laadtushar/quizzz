import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request
    const authHeader = headers().get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Update overdue assignments
    const result = await prisma.assignment.updateMany({
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

    return NextResponse.json({
      success: true,
      updated: result.count,
    })
  } catch (error) {
    console.error('Update overdue assignments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

