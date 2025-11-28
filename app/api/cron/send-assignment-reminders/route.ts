import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { sendAssignmentReminder } from '@/lib/email/sender'
import { getAppUrl } from '@/lib/utils/app-url'

export const dynamic = 'force-dynamic'

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

    // Send email notifications
    // For cron jobs, we need to construct the URL from environment or use a fallback
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000'
    let emailsSent = 0
    let emailsFailed = 0

    for (const assignment of assignments) {
      const assignmentLink = `${appUrl}/dashboard/guest/quizzes/${assignment.quizId}`
      
      const emailSent = await sendAssignmentReminder({
        email: assignment.user.email,
        displayName: assignment.user.displayName,
        quizTitle: assignment.quiz.title,
        dueDate: assignment.dueDate,
        assignmentLink,
      })

      if (emailSent) {
        emailsSent++
      } else {
        emailsFailed++
      }
    }

    // Mark reminders as sent (even if email failed, to avoid spam)
    await prisma.assignment.updateMany({
      where: {
        id: { in: assignments.map((a) => a.id) },
      },
      data: {
        reminderSent: true,
      },
    })

    console.log(`Sent ${emailsSent} reminders, ${emailsFailed} failed for ${assignments.length} assignments`)

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

