import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { requireAdmin } from '@/lib/auth/middleware'
import { generateQuizSchema } from '@/lib/validations/ai-generation'
import { generateQuiz } from '@/lib/ai/generateQuiz'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    const body = await request.json()
    const validatedData = generateQuizSchema.parse(body)

    const startTime = Date.now()

    // Generate quiz using AI
    let generatedData
    try {
      generatedData = await generateQuiz({
        inputText: validatedData.inputText,
        questionCount: validatedData.questionCount,
        difficulty: validatedData.difficulty,
        questionTypes: validatedData.questionTypes,
        title: validatedData.title,
        description: validatedData.description,
      })
    } catch (error) {
      console.error('AI generation error in API:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorStack = error instanceof Error ? error.stack : undefined
      
      // Log error
      try {
        await prisma.aIGenerationLog.create({
          data: {
            adminId: user.id,
            inputTextLength: validatedData.inputText.length,
            questionsRequested: validatedData.questionCount,
            questionsGenerated: 0,
            difficultyLevel: validatedData.difficulty,
            questionTypes: validatedData.questionTypes,
            modelUsed: 'gemini-1.5-pro',
            processingTimeMs: Date.now() - startTime,
            status: 'error',
            errorMessage: errorMessage.substring(0, 1000), // Limit length
          },
        })
      } catch (logError) {
        console.error('Failed to log AI generation error:', logError)
      }

      return NextResponse.json(
        { 
          error: 'AI generation failed', 
          details: errorMessage,
          stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
        },
        { status: 500 }
      )
    }

    // Create quiz in database within transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create quiz
      const quiz = await tx.quiz.create({
        data: {
          title: generatedData.title || validatedData.title || 'AI Generated Quiz',
          description: generatedData.description || validatedData.description,
          createdBy: user.id,
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
              correctAnswer: q.correctAnswer,
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

      // Log successful generation
      await tx.aIGenerationLog.create({
        data: {
          adminId: user.id,
          inputTextLength: validatedData.inputText.length,
          questionsRequested: validatedData.questionCount,
          questionsGenerated: generatedData.questions.length,
          difficultyLevel: validatedData.difficulty,
          questionTypes: validatedData.questionTypes,
          modelUsed: 'gemini-1.5-pro',
          processingTimeMs: generatedData.processingTimeMs,
          status: 'success',
        },
      })

      return quiz
    })

    return NextResponse.json({
      quiz: result,
      questionCount: generatedData.questions.length,
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
    console.error('Generate quiz error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

