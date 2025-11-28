import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, getCurrentUser } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For non-admin users, check if they've completed the quiz
    if (currentUser.role !== 'admin') {
      const userAttempt = await prisma.attempt.findFirst({
        where: {
          userId: currentUser.id,
          quizId: params.id,
          status: 'completed',
        },
      })

      if (!userAttempt) {
        return NextResponse.json(
          { error: 'You must complete the quiz before viewing results' },
          { status: 403 }
        )
      }
    }

    // Fetch quiz with all attempts
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
        attempts: {
          where: {
            status: 'completed',
          },
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
              },
            },
          },
          orderBy: {
            completedAt: 'desc',
          },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    const totalAttempts = quiz.attempts.length

    // Calculate question-level statistics with answer distributions
    const questionAnalytics = quiz.questions.map((question) => {
      const answerDistribution: Record<string, number> = {}
      let correctCount = 0
      let incorrectCount = 0
      let skippedCount = 0

      quiz.attempts.forEach((attempt) => {
        const answer = (attempt.answers as any[]).find(
          (a) => a.questionId === question.id
        )

        if (!answer) {
          skippedCount++
          return
        }

        if (answer.isCorrect) {
          correctCount++
        } else {
          incorrectCount++
        }

        // Build answer distribution based on question type
        if (question.type === 'mcq' || question.type === 'true_false') {
          const userAnswer = Array.isArray(answer.userAnswer)
            ? answer.userAnswer[0]
            : answer.userAnswer
          // For MCQ, use option ID to match with options array
          const answerKey = String(userAnswer || 'No answer')
          answerDistribution[answerKey] = (answerDistribution[answerKey] || 0) + 1
        } else if (question.type === 'multiple_select') {
          const userAnswers = Array.isArray(answer.userAnswer)
            ? answer.userAnswer
            : [answer.userAnswer]
          // For multiple select, count each selected option
          userAnswers.forEach((ans: any) => {
            const answerKey = String(ans || 'No answer')
            answerDistribution[answerKey] = (answerDistribution[answerKey] || 0) + 1
          })
        } else if (question.type === 'ordering') {
          const userAnswer = Array.isArray(answer.userAnswer)
            ? answer.userAnswer.join(' → ')
            : String(answer.userAnswer || 'No answer')
          answerDistribution[userAnswer] = (answerDistribution[userAnswer] || 0) + 1
        } else if (question.type === 'fill_blank') {
          const userAnswer = String(answer.userAnswer || 'No answer')
          // Group similar answers (case-insensitive, trimmed)
          const normalizedAnswer = userAnswer.trim().toLowerCase()
          answerDistribution[normalizedAnswer] =
            (answerDistribution[normalizedAnswer] || 0) + 1
        }
      })

      // For MCQ and multiple-select, map to option labels
      let answerDistributionWithLabels: Array<{ label: string; count: number; percentage: number }> = []
      
      if (question.type === 'mcq' || question.type === 'multiple_select') {
        const options = (question.options as any[]) || []
        // Create a map of option ID to option text
        const optionMap = new Map<string, string>()
        options.forEach((option) => {
          optionMap.set(String(option.id), option.text)
        })
        
        // Count answers by option ID
        const optionCounts: Record<string, number> = {}
        Object.entries(answerDistribution).forEach(([key, count]) => {
          // If key is an option ID, use it; otherwise it might be "No answer" or undefined
          if (optionMap.has(key)) {
            optionCounts[key] = (optionCounts[key] || 0) + count
          } else if (key === 'No answer' || key === 'undefined' || key === 'null') {
            optionCounts['No answer'] = (optionCounts['No answer'] || 0) + count
          }
        })
        
        // Build distribution with labels
        options.forEach((option) => {
          const count = optionCounts[String(option.id)] || 0
          answerDistributionWithLabels.push({
            label: option.text,
            count,
            percentage: totalAttempts > 0 ? (count / totalAttempts) * 100 : 0,
          })
        })
        
        // Add "No answer" if exists
        if (optionCounts['No answer']) {
          answerDistributionWithLabels.push({
            label: 'No answer',
            count: optionCounts['No answer'],
            percentage:
              totalAttempts > 0
                ? (optionCounts['No answer'] / totalAttempts) * 100
                : 0,
          })
        }
      } else if (question.type === 'true_false') {
        // For true/false, map boolean values to labels
        const trueCount = answerDistribution['true'] || answerDistribution['True'] || 0
        const falseCount = answerDistribution['false'] || answerDistribution['False'] || 0
        const noAnswerCount = answerDistribution['No answer'] || answerDistribution['undefined'] || 0
        
        answerDistributionWithLabels = [
          { label: 'True', count: trueCount, percentage: totalAttempts > 0 ? (trueCount / totalAttempts) * 100 : 0 },
          { label: 'False', count: falseCount, percentage: totalAttempts > 0 ? (falseCount / totalAttempts) * 100 : 0 },
        ]
        
        if (noAnswerCount > 0) {
          answerDistributionWithLabels.push({
            label: 'No answer',
            count: noAnswerCount,
            percentage: totalAttempts > 0 ? (noAnswerCount / totalAttempts) * 100 : 0,
          })
        }
      } else {
        // For other question types (ordering, fill_blank), use the raw distribution
        Object.entries(answerDistribution).forEach(([label, count]) => {
          answerDistributionWithLabels.push({
            label: label.length > 50 ? label.substring(0, 50) + '...' : label,
            count,
            percentage: totalAttempts > 0 ? (count / totalAttempts) * 100 : 0,
          })
        })
      }

      // Sort by count descending
      answerDistributionWithLabels.sort((a, b) => b.count - a.count)

      // Collect individual user responses for this question
      const userResponses = quiz.attempts.map((attempt) => {
        const answer = (attempt.answers as any[]).find(
          (a) => a.questionId === question.id
        )

        let userAnswerLabel = 'No answer'
        let isCorrect = false
        let pointsEarned = 0

        if (answer) {
          isCorrect = answer.isCorrect
          pointsEarned = answer.pointsEarned || 0

          // Format user answer based on question type
          if (question.type === 'mcq' || question.type === 'true_false') {
            const userAnswer = Array.isArray(answer.userAnswer)
              ? answer.userAnswer[0]
              : answer.userAnswer
            
            if (question.type === 'mcq') {
              const options = (question.options as any[]) || []
              const selectedOption = options.find(
                (opt) => String(opt.id) === String(userAnswer)
              )
              userAnswerLabel = selectedOption ? selectedOption.text : String(userAnswer || 'No answer')
            } else if (question.type === 'true_false') {
              userAnswerLabel = userAnswer === true || userAnswer === 'true' ? 'True' : 
                               userAnswer === false || userAnswer === 'false' ? 'False' : 
                               String(userAnswer || 'No answer')
            }
          } else if (question.type === 'multiple_select') {
            const userAnswers = Array.isArray(answer.userAnswer)
              ? answer.userAnswer
              : [answer.userAnswer]
            const options = (question.options as any[]) || []
            const selectedOptions = userAnswers
              .map((ans: any) => {
                const option = options.find((opt: any) => String(opt.id) === String(ans))
                return option ? option.text : null
              })
              .filter(Boolean)
            userAnswerLabel = selectedOptions.length > 0 
              ? selectedOptions.join(', ') 
              : 'No answer'
          } else if (question.type === 'ordering') {
            const userAnswer = Array.isArray(answer.userAnswer)
              ? answer.userAnswer
              : [answer.userAnswer]
            userAnswerLabel = userAnswer.join(' → ')
          } else if (question.type === 'fill_blank') {
            userAnswerLabel = String(answer.userAnswer || 'No answer')
          }
        }

        return {
          userId: attempt.user.id,
          userName: attempt.user.displayName,
          userEmail: attempt.user.email,
          userAnswer: userAnswerLabel,
          isCorrect,
          pointsEarned,
          completedAt: attempt.completedAt,
        }
      })

      return {
        questionId: question.id,
        questionText: question.questionText,
        questionType: question.type,
        orderIndex: question.orderIndex,
        points: question.points,
        correctAnswer: question.correctAnswer,
        options: question.options,
        totalResponses: totalAttempts,
        correctCount,
        incorrectCount,
        skippedCount,
        accuracy: totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0,
        answerDistribution: answerDistributionWithLabels,
        userResponses, // Add individual user responses
      }
    })

    // Overall statistics
    const passedAttempts = quiz.attempts.filter((a) => a.isPassed).length
    const averageScore =
      totalAttempts > 0
        ? quiz.attempts.reduce(
            (sum, a) => sum + Number(a.percentage || 0),
            0
          ) / totalAttempts
        : 0

    // Score distribution (buckets: 0-20, 21-40, 41-60, 61-80, 81-100)
    const scoreDistribution = [
      { range: '0-20%', count: 0 },
      { range: '21-40%', count: 0 },
      { range: '41-60%', count: 0 },
      { range: '61-80%', count: 0 },
      { range: '81-100%', count: 0 },
    ]

    quiz.attempts.forEach((attempt) => {
      const percentage = Number(attempt.percentage || 0)
      if (percentage <= 20) scoreDistribution[0].count++
      else if (percentage <= 40) scoreDistribution[1].count++
      else if (percentage <= 60) scoreDistribution[2].count++
      else if (percentage <= 80) scoreDistribution[3].count++
      else scoreDistribution[4].count++
    })

    // Response over time (grouped by day)
    const responsesOverTime: Record<string, number> = {}
    quiz.attempts.forEach((attempt) => {
      if (attempt.completedAt) {
        const date = new Date(attempt.completedAt).toLocaleDateString()
        responsesOverTime[date] = (responsesOverTime[date] || 0) + 1
      }
    })

    const responsesOverTimeArray = Object.entries(responsesOverTime)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        questionCount: quiz.questionCount,
        totalPoints: quiz.totalPoints,
      },
      summary: {
        totalAttempts,
        passedAttempts,
        failedAttempts: totalAttempts - passedAttempts,
        averageScore: Math.round(averageScore * 100) / 100,
        passRate:
          totalAttempts > 0
            ? Math.round((passedAttempts / totalAttempts) * 100 * 100) / 100
            : 0,
      },
      scoreDistribution,
      responsesOverTime: responsesOverTimeArray,
      questionAnalytics,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Get quiz results error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

