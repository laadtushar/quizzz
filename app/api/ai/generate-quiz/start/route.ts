import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/middleware'
import { generateQuizSchema } from '@/lib/validations/ai-generation'
import { AIGenerationStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for large transcript processing

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    
    // Parse body
    let body
    try {
      body = await request.json()
    } catch (error) {
      if (error instanceof Error && error.message.includes('body')) {
        return NextResponse.json(
          { error: 'Request body too large. Maximum size is 20MB.' },
          { status: 413 }
        )
      }
      throw error
    }
    const validatedData = generateQuizSchema.parse(body)

    // Create log entry immediately with "processing" status
    const logEntry = await prisma.aIGenerationLog.create({
      data: {
        adminId: user.id,
        inputTextLength: validatedData.inputText.length,
        questionsRequested: validatedData.questionCount,
        questionsGenerated: 0,
        difficultyLevel: validatedData.difficulty,
        questionTypes: validatedData.questionTypes,
        modelUsed: 'gemini-1.5-pro',
        status: 'processing' as any, // Type will be correct after Prisma client regeneration
        processingTimeMs: null as any,
      },
    })

    // For serverless environments, we need to process synchronously
    // but return the job ID immediately and process in the background
    // Note: In Vercel/serverless, the function will continue running after response
    // if we don't await, but it's not guaranteed. For production, consider using
    // a job queue service or Vercel Background Functions (Pro plan)
    
    // Start processing - don't await, let it run in background
    processGeneration(logEntry.id, validatedData, user.id).catch((error) => {
      console.error('Background generation error:', error)
    })

    // Return immediately with job ID
    return NextResponse.json({
      jobId: logEntry.id,
      status: 'processing',
      message: 'Quiz generation started. Poll /api/ai/generate-quiz/status/[jobId] for updates.',
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      )
    }
    console.error('Start generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Background processing function
async function processGeneration(
  logId: string,
  validatedData: any,
  adminId: string
) {
  const startTime = Date.now()
  
  try {
    // Import here to avoid circular dependencies
    const { generateQuiz } = await import('@/lib/ai/generateQuiz')
    const { Prisma } = await import('@prisma/client')

    // Generate quiz using AI
    const generatedData = await generateQuiz({
      inputText: validatedData.inputText,
      questionCount: validatedData.questionCount,
      difficulty: validatedData.difficulty,
      questionTypes: validatedData.questionTypes,
      title: validatedData.title,
      description: validatedData.description,
    })

    // Create quiz in database within transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create quiz
      const quiz = await tx.quiz.create({
        data: {
          title: generatedData.title || validatedData.title || 'AI Generated Quiz',
          description: generatedData.description || validatedData.description,
          createdBy: adminId,
          visibility: 'hidden',
          status: 'draft',
          settingsTimerSeconds: null,
          settingsAllowRetries: true,
          settingsDifficultyLevel: validatedData.difficulty,
          settingsPassingScore: 60,
          questionCount: generatedData.questions.length,
          totalPoints: generatedData.questions.reduce((sum, q) => sum + q.points, 0),
          questions: {
            create: generatedData.questions.map((q, index) => ({
              orderIndex: index,
              type: q.type,
              questionText: q.questionText,
              points: q.points,
              options: q.options ? q.options : Prisma.JsonNull,
              correctAnswer: q.correctAnswer ? q.correctAnswer : Prisma.JsonNull,
              explanation: q.explanation || null,
            })),
          },
        },
        include: {
          questions: {
            orderBy: {
              orderIndex: 'asc',
            },
          },
        },
      })

      // Update log with success
      await tx.aIGenerationLog.update({
        where: { id: logId },
        data: {
          status: 'success' as any,
          questionsGenerated: generatedData.questions.length,
          processingTimeMs: Date.now() - startTime,
          quizId: quiz.id as any, // Type will be correct after Prisma client regeneration
        } as any,
      })

      return quiz
    })

    console.log(`Generation completed for job ${logId}, quiz ID: ${result.id}`)
  } catch (error) {
    console.error('AI generation error in background:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Update log with error
    try {
      await prisma.aIGenerationLog.update({
        where: { id: logId },
        data: {
          status: 'error' as any,
          processingTimeMs: Date.now() - startTime,
          errorMessage: errorMessage.substring(0, 1000), // Limit length
        },
      })
    } catch (logError) {
      console.error('Failed to update generation log:', logError)
    }
  }
}

