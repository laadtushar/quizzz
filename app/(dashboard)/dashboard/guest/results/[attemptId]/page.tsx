'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { QuestionRenderer } from '@/components/quiz/QuestionRenderer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Trophy, Clock } from 'lucide-react'

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const attemptId = params.attemptId as string

  const { data, isLoading } = useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: async () => {
      const res = await fetch(`/api/attempts/${attemptId}`)
      if (!res.ok) throw new Error('Failed to fetch results')
      return res.json()
    },
  })

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const attempt = data?.attempt
  if (!attempt) {
    return <div>Results not found</div>
  }

  const quiz = attempt.quiz
  const questions = quiz.questions || []
  const answers = attempt.answers || []

  const correctCount = answers.filter((a: any) => a.isCorrect).length
  const totalQuestions = questions.length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{quiz.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {attempt.score}/{attempt.maxScore}
              </div>
              <div className="text-sm text-muted-foreground">Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {attempt.percentage != null ? Number(attempt.percentage).toFixed(1) : '0.0'}%
              </div>
              <div className="text-sm text-muted-foreground">Percentage</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">
                {correctCount}/{totalQuestions}
              </div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold flex items-center justify-center gap-1">
                <Trophy className="h-6 w-6 text-yellow-500" />
                {attempt.xpAwarded || 0}
              </div>
              <div className="text-sm text-muted-foreground">XP Earned</div>
            </div>
          </div>

          {attempt.timeSpent && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Time taken: {Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s</span>
            </div>
          )}

          <div className={attempt.isPassed ? 'text-green-600' : 'text-red-600'}>
            {attempt.isPassed ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Passed!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                <span className="font-semibold">Not Passed</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Review Answers</h2>
        {questions.map((question: any, index: number) => {
          const answer = answers.find((a: any) => a.questionId === question.id)
          return (
            <div key={question.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Question {index + 1}</span>
                {answer?.isCorrect ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="text-sm text-muted-foreground">
                  ({answer?.pointsEarned || 0}/{question.points} points)
                </span>
              </div>
              <QuestionRenderer
                question={question}
                value={answer?.userAnswer}
                disabled
                showAnswer
              />
            </div>
          )
        })}
      </div>

      <div className="flex gap-4">
        <Button onClick={() => router.push('/dashboard/guest/quizzes')}>
          Back to Quizzes
        </Button>
        {quiz.settingsAllowRetries && (
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/guest/quizzes/${quiz.id}/take`)}
          >
            Retake Quiz
          </Button>
        )}
      </div>
    </div>
  )
}

