import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/middleware'
import { jsPDF } from 'jspdf'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAdmin()

    // Fetch quiz with all related data
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        creator: {
          select: {
            displayName: true,
            email: true,
          },
        },
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
                displayName: true,
                email: true,
              },
            },
          },
          orderBy: {
            completedAt: 'desc',
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                displayName: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Calculate statistics
    const totalAttempts = quiz.attempts.length
    const passedAttempts = quiz.attempts.filter((a) => a.isPassed).length
    const averageScore =
      totalAttempts > 0
        ? quiz.attempts.reduce(
            (sum, a) => sum + Number(a.percentage || 0),
            0
          ) / totalAttempts
        : 0
    const averageTime =
      totalAttempts > 0
        ? quiz.attempts.reduce(
            (sum, a) => sum + (a.timeSpent || 0),
            0
          ) / totalAttempts
        : 0

    // Question-level statistics
    const questionStats = quiz.questions.map((question) => {
      const correctCount = quiz.attempts.filter((attempt) => {
        const answer = (attempt.answers as any[]).find(
          (a) => a.questionId === question.id && a.isCorrect
        )
        return answer !== undefined
      }).length
      const accuracy = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0

      return {
        question,
        correctCount,
        accuracy,
        totalAttempts,
      }
    })

    // Create PDF
    const doc = new jsPDF()
    let yPosition = 20
    const pageHeight = doc.internal.pageSize.height
    const margin = 20
    const maxWidth = doc.internal.pageSize.width - 2 * margin

    // Helper function to add new page if needed
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
        return true
      }
      return false
    }

    // Helper function to add text with word wrap
    const addText = (text: string, x: number, y: number, options?: any) => {
      const lines = doc.splitTextToSize(text, maxWidth - x)
      doc.text(lines, x, y, options)
      return lines.length * 7 // Approximate line height
    }

    // Title
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    const titleLines = doc.splitTextToSize(quiz.title, maxWidth)
    doc.text(titleLines, margin, yPosition, { align: 'center' })
    yPosition += titleLines.length * 10 + 5

    if (quiz.description) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const descLines = doc.splitTextToSize(quiz.description, maxWidth)
      doc.text(descLines, margin, yPosition, { align: 'center' })
      yPosition += descLines.length * 5 + 5
    }

    doc.setFontSize(8)
    doc.text(
      `Generated on: ${new Date().toLocaleString()}`,
      margin,
      yPosition,
      { align: 'right' }
    )
    yPosition += 15

    // Quiz Information
    checkNewPage(30)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Quiz Information', margin, yPosition)
    yPosition += 10
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const quizInfo = [
      `Created by: ${quiz.creator.displayName} (${quiz.creator.email})`,
      `Created on: ${new Date(quiz.createdAt).toLocaleDateString()}`,
      `Status: ${quiz.status}`,
      `Visibility: ${quiz.visibility}`,
      `Difficulty: ${quiz.settingsDifficultyLevel}`,
      `Total Questions: ${quiz.questionCount}`,
      `Total Points: ${quiz.totalPoints}`,
      quiz.settingsPassingScore
        ? `Passing Score: ${Number(quiz.settingsPassingScore)}%`
        : null,
      quiz.settingsTimerSeconds
        ? `Time Limit: ${Math.floor(quiz.settingsTimerSeconds / 60)} minutes`
        : null,
      `Allow Retries: ${quiz.settingsAllowRetries ? 'Yes' : 'No'}`,
      quiz.tags && quiz.tags.length > 0 ? `Tags: ${quiz.tags.join(', ')}` : null,
    ].filter(Boolean)

    quizInfo.forEach((info) => {
      checkNewPage(10)
      doc.text(info as string, margin, yPosition)
      yPosition += 7
    })
    yPosition += 5

    // Overall Statistics
    checkNewPage(40)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Overall Statistics', margin, yPosition)
    yPosition += 10
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const stats = [
      `Total Attempts: ${totalAttempts}`,
      `Passed: ${passedAttempts} (${
        totalAttempts > 0
          ? ((passedAttempts / totalAttempts) * 100).toFixed(1)
          : 0
      }%)`,
      `Failed: ${totalAttempts - passedAttempts} (${
        totalAttempts > 0
          ? (((totalAttempts - passedAttempts) / totalAttempts) * 100).toFixed(1)
          : 0
      }%)`,
      `Average Score: ${averageScore.toFixed(1)}%`,
      `Average Time: ${Math.floor(averageTime / 60)}m ${Math.floor(
        averageTime % 60
      )}s`,
    ]

    stats.forEach((stat) => {
      checkNewPage(10)
      doc.text(stat, margin, yPosition)
      yPosition += 7
    })
    yPosition += 5

    // Question Performance
    checkNewPage(30)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Question Performance', margin, yPosition)
    yPosition += 10
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    questionStats.forEach((stat, index) => {
      checkNewPage(20)
      const questionText = `Question ${index + 1}: ${stat.question.questionText.substring(0, 60)}...`
      yPosition += addText(questionText, margin, yPosition)
      yPosition += 5
      doc.text(
        `  Correct Answers: ${stat.correctCount}/${stat.totalAttempts} (${stat.accuracy.toFixed(1)}%)`,
        margin + 5,
        yPosition
      )
      yPosition += 7
      doc.text(`  Points: ${stat.question.points}`, margin + 5, yPosition)
      yPosition += 10
    })

    // Individual Attempts
    if (quiz.attempts.length > 0) {
      checkNewPage(30)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Individual Attempts', margin, yPosition)
      yPosition += 10
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')

      quiz.attempts.slice(0, 10).forEach((attempt) => {
        checkNewPage(40)
        doc.setFont('helvetica', 'bold')
        yPosition += addText(
          `${attempt.user.displayName} (${attempt.user.email})`,
          margin,
          yPosition
        )
        yPosition += 5
        doc.setFont('helvetica', 'normal')
        doc.text(
          `  Score: ${attempt.score}/${attempt.maxScore} (${Number(
            attempt.percentage || 0
          ).toFixed(1)}%)`,
          margin + 5,
          yPosition
        )
        yPosition += 7
        doc.text(
          `  Status: ${attempt.isPassed ? 'Passed ✓' : 'Failed ✗'}`,
          margin + 5,
          yPosition
        )
        yPosition += 7
        doc.text(
          `  XP Awarded: ${attempt.xpAwarded || 0}`,
          margin + 5,
          yPosition
        )
        yPosition += 7
        if (attempt.completedAt) {
          doc.text(
            `  Completed: ${new Date(attempt.completedAt).toLocaleString()}`,
            margin + 5,
            yPosition
          )
          yPosition += 7
        }
        if (attempt.timeSpent) {
          doc.text(
            `  Time Spent: ${Math.floor(attempt.timeSpent / 60)}m ${attempt.timeSpent % 60}s`,
            margin + 5,
            yPosition
          )
          yPosition += 7
        }
        yPosition += 5
      })

      if (quiz.attempts.length > 10) {
        checkNewPage(10)
        doc.text(
          `... and ${quiz.attempts.length - 10} more attempts`,
          margin,
          yPosition
        )
        yPosition += 10
      }
    }

    // Assignments
    if (quiz.assignments.length > 0) {
      checkNewPage(30)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Assignments', margin, yPosition)
      yPosition += 10
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')

      quiz.assignments.forEach((assignment) => {
        checkNewPage(30)
        doc.setFont('helvetica', 'bold')
        yPosition += addText(
          `${assignment.user.displayName} (${assignment.user.email})`,
          margin,
          yPosition
        )
        yPosition += 5
        doc.setFont('helvetica', 'normal')
        doc.text(`  Status: ${assignment.status}`, margin + 5, yPosition)
        yPosition += 7
        if (assignment.dueDate) {
          doc.text(
            `  Due Date: ${new Date(assignment.dueDate).toLocaleString()}`,
            margin + 5,
            yPosition
          )
          yPosition += 7
        }
        if (assignment.completedAt) {
          doc.text(
            `  Completed: ${new Date(assignment.completedAt).toLocaleString()}`,
            margin + 5,
            yPosition
          )
          yPosition += 7
        }
        if (assignment.score) {
          doc.text(
            `  Score: ${Number(assignment.score).toFixed(1)}%`,
            margin + 5,
            yPosition
          )
          yPosition += 7
        }
        yPosition += 5
      })
    }

    // Key Takeaways
    checkNewPage(50)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Key Takeaways', margin, yPosition)
    yPosition += 10
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    // Most difficult questions
    const difficultQuestions = questionStats
      .filter((s) => s.accuracy < 50)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3)

    if (difficultQuestions.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.text('Most Difficult Questions:', margin, yPosition)
      yPosition += 7
      doc.setFont('helvetica', 'normal')
      difficultQuestions.forEach((stat, index) => {
        const qIndex = quiz.questions.findIndex((q) => q.id === stat.question.id)
        doc.text(
          `  ${index + 1}. Question ${qIndex + 1}: Only ${stat.accuracy.toFixed(1)}% answered correctly`,
          margin + 5,
          yPosition
        )
        yPosition += 7
      })
      yPosition += 5
    }

    // Performance insights
    doc.setFont('helvetica', 'bold')
    doc.text('Performance Insights:', margin, yPosition)
    yPosition += 7
    doc.setFont('helvetica', 'normal')

    const insights = []
    if (averageScore >= 80) {
      insights.push('• Overall performance is excellent')
    } else if (averageScore >= 60) {
      insights.push('• Overall performance is good')
    } else {
      insights.push('• Overall performance needs improvement')
    }

    if (passedAttempts / totalAttempts >= 0.8) {
      insights.push('• High pass rate indicates good understanding')
    } else if (passedAttempts / totalAttempts < 0.5) {
      insights.push('• Low pass rate - consider reviewing quiz difficulty')
    }

    insights.forEach((insight) => {
      checkNewPage(10)
      doc.text(insight, margin + 5, yPosition)
      yPosition += 7
    })

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="quiz-report-${quiz.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.pdf"`,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    console.error('Export PDF error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
