import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, getCurrentUser } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const logEntry = await prisma.aIGenerationLog.findUnique({
      where: { id: params.jobId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            questionCount: true,
          },
        },
      },
    })

    if (!logEntry) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Users can only see their own generation jobs, admins can see all
    if (currentUser.role !== 'admin' && logEntry.adminId !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      jobId: logEntry.id,
      status: logEntry.status,
      questionsGenerated: logEntry.questionsGenerated,
      questionsRequested: logEntry.questionsRequested,
      processingTimeMs: logEntry.processingTimeMs,
      errorMessage: logEntry.errorMessage,
      quiz: logEntry.quiz
        ? {
            id: logEntry.quiz.id,
            title: logEntry.quiz.title,
            questionCount: logEntry.quiz.questionCount,
          }
        : null,
    })
  } catch (error) {
    console.error('Get generation status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

