'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { QuestionRenderer } from '@/components/quiz/QuestionRenderer'
import { QuizTimer } from '@/components/quiz/QuizTimer'
import { QuizProgressBar } from '@/components/quiz/QuizProgressBar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'

export default function TakeQuizPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const quizId = params.quizId as string

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [startTime] = useState(Date.now())
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)

  // Fetch quiz
  const { data: quizData, isLoading: quizLoading } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const res = await fetch(`/api/quizzes/${quizId}`)
      if (!res.ok) throw new Error('Failed to fetch quiz')
      return res.json()
    },
  })

  // Start attempt
  const { data: attemptData, isLoading: attemptLoading } = useQuery({
    queryKey: ['attempt', quizId],
    queryFn: async () => {
      const res = await fetch(`/api/quizzes/${quizId}/attempts`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to start attempt')
      return res.json()
    },
    enabled: !!quizData,
  })

  // Save attempt mutation
  const saveMutation = useMutation({
    mutationFn: async (answers: Record<string, any>) => {
      if (!attemptData?.attempt?.id) return
      const res = await fetch(`/api/attempts/${attemptData.attempt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: Object.entries(answers).map(([questionId, userAnswer]) => ({
          questionId,
          userAnswer,
        })) }),
      })
      if (!res.ok) throw new Error('Failed to save')
      return res.json()
    },
  })

  // Submit attempt mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!attemptData?.attempt?.id) return
      const timeSpent = Math.floor((Date.now() - startTime) / 1000)
      const res = await fetch(`/api/attempts/${attemptData.attempt.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, userAnswer]) => ({
            questionId,
            userAnswer,
          })),
          timeSpent,
        }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      return res.json()
    },
    onSuccess: (data) => {
      toast({
        title: 'Quiz submitted!',
        description: `You scored ${data.percentage?.toFixed(1)}%`,
      })
      router.push(`/dashboard/results/${attemptData.attempt.id}`)
    },
  })

  // Auto-save
  useEffect(() => {
    if (Object.keys(answers).length > 0 && attemptData?.attempt?.id) {
      const timer = setTimeout(() => {
        saveMutation.mutate(answers)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [answers, attemptData])

  if (quizLoading || attemptLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const quiz = quizData?.quiz
  const attempt = attemptData?.attempt
  const questions = quiz?.questions || []
  const currentQuestion = questions[currentQuestionIndex]

  if (!quiz || !attempt || questions.length === 0) {
    return <div>Quiz not found</div>
  }

  const handleAnswerChange = (value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmit = () => {
    setShowSubmitDialog(true)
  }

  const confirmSubmit = () => {
    setShowSubmitDialog(false)
    submitMutation.mutate()
  }

  const timerSeconds = quiz.settingsTimerSeconds
  const handleTimerExpire = () => {
    submitMutation.mutate()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        {timerSeconds && (
          <QuizTimer totalSeconds={timerSeconds} onExpire={handleTimerExpire} />
        )}
      </div>

      <QuizProgressBar current={currentQuestionIndex + 1} total={questions.length} />

      <QuestionRenderer
        question={currentQuestion}
        value={answers[currentQuestion.id]}
        onChange={handleAnswerChange}
      />

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="flex gap-2">
          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
            >
              <Check className="mr-2 h-4 w-4" />
              {submitMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Quiz?</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit your quiz? You cannot change your answers after submitting.
              <br />
              <br />
              You have answered {Object.keys(answers).length} out of {questions.length} questions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSubmit} disabled={submitMutation.isPending}>
              {submitMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

