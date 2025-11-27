import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (Vercel sets this header)
    const authHeader = headers().get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Find assignments due within 24 hours that haven't been reminded
    const assignments = await prisma.assignment.findMany({
      where: {
        status: 'pending',
        dueDate: {
          gte: now,
          lte: tomorrow,
        },
        reminderSent: false,
      },
      include: {
        user: {
          select: {
            email: true,
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

    // Mark reminders as sent
    await prisma.assignment.updateMany({
      where: {
        id: { in: assignments.map((a) => a.id) },
      },
      data: {
        reminderSent: true,
      },
    })

    // TODO: Send email notifications
    // For now, just log
    console.log(`Sent reminders for ${assignments.length} assignments`)

    return NextResponse.json({
      success: true,
      remindersSent: assignments.length,
    })
  } catch (error) {
    console.error('Send reminders error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

