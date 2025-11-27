import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/middleware'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
} from '@react-pdf/renderer'

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
    borderBottom: '1 solid #000',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
    width: 150,
  },
  value: {
    flex: 1,
  },
  table: {
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #ddd',
    paddingVertical: 5,
  },
  tableHeader: {
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
  },
  tableCell: {
    flex: 1,
    padding: 5,
  },
  statBox: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  attemptSection: {
    marginTop: 15,
    padding: 10,
    border: '1 solid #ddd',
    marginBottom: 15,
  },
  correct: {
    color: '#22c55e',
  },
  incorrect: {
    color: '#ef4444',
  },
})

// PDF Document Component
const QuizReportPDF = ({ quiz, stats, questionStats, attempts, assignments }: any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{quiz.title}</Text>
      {quiz.description && (
        <Text style={styles.subtitle}>{quiz.description}</Text>
      )}
      <Text style={styles.subtitle}>
        Generated on: {new Date().toLocaleString()}
      </Text>

      {/* Quiz Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quiz Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Created by:</Text>
          <Text style={styles.value}>
            {quiz.creator.displayName} ({quiz.creator.email})
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Created on:</Text>
          <Text style={styles.value}>
            {new Date(quiz.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status:</Text>
          <Text style={styles.value}>{quiz.status}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Visibility:</Text>
          <Text style={styles.value}>{quiz.visibility}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Difficulty:</Text>
          <Text style={styles.value}>{quiz.settingsDifficultyLevel}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Questions:</Text>
          <Text style={styles.value}>{quiz.questionCount}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Points:</Text>
          <Text style={styles.value}>{quiz.totalPoints}</Text>
        </View>
        {quiz.settingsPassingScore && (
          <View style={styles.row}>
            <Text style={styles.label}>Passing Score:</Text>
            <Text style={styles.value}>
              {Number(quiz.settingsPassingScore)}%
            </Text>
          </View>
        )}
        {quiz.settingsTimerSeconds && (
          <View style={styles.row}>
            <Text style={styles.label}>Time Limit:</Text>
            <Text style={styles.value}>
              {Math.floor(quiz.settingsTimerSeconds / 60)} minutes
            </Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>Allow Retries:</Text>
          <Text style={styles.value}>
            {quiz.settingsAllowRetries ? 'Yes' : 'No'}
          </Text>
        </View>
        {quiz.tags && quiz.tags.length > 0 && (
          <View style={styles.row}>
            <Text style={styles.label}>Tags:</Text>
            <Text style={styles.value}>{quiz.tags.join(', ')}</Text>
          </View>
        )}
      </View>

      {/* Overall Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overall Statistics</Text>
        <View style={styles.statBox}>
          <View style={styles.row}>
            <Text style={styles.label}>Total Attempts:</Text>
            <Text style={styles.value}>{stats.totalAttempts}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Passed:</Text>
            <Text style={styles.value}>
              {stats.passedAttempts} (
              {stats.totalAttempts > 0
                ? ((stats.passedAttempts / stats.totalAttempts) * 100).toFixed(1)
                : 0}
              %)
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Failed:</Text>
            <Text style={styles.value}>
              {stats.totalAttempts - stats.passedAttempts} (
              {stats.totalAttempts > 0
                ? (((stats.totalAttempts - stats.passedAttempts) /
                    stats.totalAttempts) *
                    100).toFixed(1)
                : 0}
              %)
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Average Score:</Text>
            <Text style={styles.value}>{stats.averageScore.toFixed(1)}%</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Average Time:</Text>
            <Text style={styles.value}>
              {Math.floor(stats.averageTime / 60)}m{' '}
              {Math.floor(stats.averageTime % 60)}s
            </Text>
          </View>
        </View>
      </View>

      {/* Question Performance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Question Performance</Text>
        {questionStats.map((stat: any, index: number) => (
          <View key={stat.question.id} style={styles.statBox}>
            <Text>
              Question {index + 1}:{' '}
              {stat.question.questionText.substring(0, 60)}...
            </Text>
            <Text>
              Correct Answers: {stat.correctCount}/{stat.totalAttempts} (
              {stat.accuracy.toFixed(1)}%)
            </Text>
            <Text>Points: {stat.question.points}</Text>
          </View>
        ))}
      </View>
    </Page>

    {/* Individual Attempts */}
    {attempts.length > 0 && (
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Individual Attempts</Text>
        {attempts.slice(0, 5).map((attempt: any, index: number) => (
          <View key={attempt.id} style={styles.attemptSection}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>
              {attempt.user.displayName} ({attempt.user.email})
            </Text>
            <View style={styles.row}>
              <Text style={styles.label}>Score:</Text>
              <Text style={styles.value}>
                {attempt.score}/{attempt.maxScore} (
                {Number(attempt.percentage || 0).toFixed(1)}%)
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Status:</Text>
              <Text
                style={[
                  styles.value,
                  attempt.isPassed ? styles.correct : styles.incorrect,
                ]}
              >
                {attempt.isPassed ? 'Passed ✓' : 'Failed ✗'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>XP Awarded:</Text>
              <Text style={styles.value}>{attempt.xpAwarded || 0}</Text>
            </View>
            {attempt.completedAt && (
              <View style={styles.row}>
                <Text style={styles.label}>Completed:</Text>
                <Text style={styles.value}>
                  {new Date(attempt.completedAt).toLocaleString()}
                </Text>
              </View>
            )}
            {attempt.timeSpent && (
              <View style={styles.row}>
                <Text style={styles.label}>Time Spent:</Text>
                <Text style={styles.value}>
                  {Math.floor(attempt.timeSpent / 60)}m{' '}
                  {attempt.timeSpent % 60}s
                </Text>
              </View>
            )}
          </View>
        ))}
        {attempts.length > 5 && (
          <Text style={{ marginTop: 10, color: '#666' }}>
            ... and {attempts.length - 5} more attempts
          </Text>
        )}
      </Page>
    )}

    {/* Assignments */}
    {assignments.length > 0 && (
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Assignments</Text>
        {assignments.map((assignment: any) => (
          <View key={assignment.id} style={styles.attemptSection}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>
              {assignment.user.displayName} ({assignment.user.email})
            </Text>
            <View style={styles.row}>
              <Text style={styles.label}>Status:</Text>
              <Text style={styles.value}>{assignment.status}</Text>
            </View>
            {assignment.dueDate && (
              <View style={styles.row}>
                <Text style={styles.label}>Due Date:</Text>
                <Text style={styles.value}>
                  {new Date(assignment.dueDate).toLocaleString()}
                </Text>
              </View>
            )}
            {assignment.completedAt && (
              <View style={styles.row}>
                <Text style={styles.label}>Completed:</Text>
                <Text style={styles.value}>
                  {new Date(assignment.completedAt).toLocaleString()}
                </Text>
              </View>
            )}
            {assignment.score && (
              <View style={styles.row}>
                <Text style={styles.label}>Score:</Text>
                <Text style={styles.value}>
                  {Number(assignment.score).toFixed(1)}%
                </Text>
              </View>
            )}
          </View>
        ))}
      </Page>
    )}
  </Document>
)

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

    const stats = {
      totalAttempts,
      passedAttempts,
      averageScore,
      averageTime,
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      React.createElement(QuizReportPDF, {
        quiz,
        stats,
        questionStats,
        attempts: quiz.attempts,
        assignments: quiz.assignments,
      })
    )

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
