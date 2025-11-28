'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { QuestionRenderer } from '@/components/quiz/QuestionRenderer'
import { QuizTimer } from '@/components/quiz/QuizTimer'
import { QuizProgressBar } from '@/components/quiz/QuizProgressBar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft, ArrowRight, Check, Clock, FileQuestion, AlertCircle, Save } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function TakeQuizPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const quizId = params.quizId as string

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [startTime] = useState(Date.now())
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showPreQuizScreen, setShowPreQuizScreen] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch quiz
  const { data: quizData, isLoading: quizLoading } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const res = await fetch(`/api/quizzes/${quizId}`)
      if (!res.ok) throw new Error('Failed to fetch quiz')
      return res.json()
    },
  })

  // Check for existing attempts
  const { data: existingAttempts } = useQuery({
    queryKey: ['attempts', quizId],
    queryFn: async () => {
      const res = await fetch(`/api/quizzes/${quizId}/attempts`)
      if (!res.ok) return { attempts: [] }
      return res.json()
    },
    enabled: !!quizData,
  })

  // Start attempt
  const { data: attemptData, isLoading: attemptLoading } = useQuery({
    queryKey: ['attempt', quizId],
    queryFn: async () => {
      const res = await fetch(`/api/quizzes/${quizId}/attempts`, {
        method: 'POST',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to start attempt')
      }
      return res.json()
    },
    enabled: !!quizData && !showPreQuizScreen,
  })

  // Save attempt mutation
  const saveMutation = useMutation({
    mutationFn: async (answers: Record<string, any>) => {
      if (!attemptData?.attempt?.id) return
      const res = await fetch(`/api/attempts/${attemptData.attempt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, userAnswer]) => ({
            questionId,
            userAnswer,
          })),
        }),
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
      // Clear sessionStorage backup
      sessionStorage.removeItem(`quiz-attempt-${quizId}`)
      toast({
        title: 'Quiz submitted!',
        description: `You scored ${data.percentage != null ? Number(data.percentage).toFixed(1) : '0.0'}%`,
      })
      router.push(`/dashboard/guest/results/${attemptData.attempt.id}`)
    },
  })

  // Auto-save every 30 seconds
  useEffect(() => {
    if (Object.keys(answers).length > 0 && attemptData?.attempt?.id && !showPreQuizScreen) {
      const interval = setInterval(() => {
        saveMutation.mutate(answers)
      }, 30000) // 30 seconds
      return () => clearInterval(interval)
    }
  }, [answers, attemptData, saveMutation, showPreQuizScreen])

  // Save to sessionStorage as backup
  useEffect(() => {
    if (attemptData?.attempt?.id && !showPreQuizScreen) {
      const backupData = {
        attemptId: attemptData.attempt.id,
        quizId,
        answers,
        currentQuestionIndex,
        startTime,
      }
      sessionStorage.setItem(`quiz-attempt-${quizId}`, JSON.stringify(backupData))
    }
  }, [answers, currentQuestionIndex, attemptData, quizId, startTime, showPreQuizScreen])

  // Restore from sessionStorage on mount
  useEffect(() => {
    if (quizId && attemptData?.attempt?.id && !showPreQuizScreen) {
      const backup = sessionStorage.getItem(`quiz-attempt-${quizId}`)
      if (backup) {
        try {
          const backupData = JSON.parse(backup)
          if (backupData.attemptId === attemptData.attempt.id) {
            setAnswers(backupData.answers || {})
            setCurrentQuestionIndex(backupData.currentQuestionIndex || 0)
          }
        } catch (e) {
          // Invalid backup data, ignore
        }
      }
    }
  }, [quizId, attemptData, showPreQuizScreen])

  // Multiple tab prevention
  useEffect(() => {
    if (!showPreQuizScreen && attemptData?.attempt?.id) {
      const channel = new BroadcastChannel(`quiz-${quizId}-${attemptData.attempt.id}`)
      
      // Listen for other tabs
      channel.onmessage = (event) => {
        if (event.data.type === 'quiz-active') {
          toast({
            title: 'Quiz Already Open',
            description: 'This quiz is already open in another tab. Please close other tabs to continue.',
            variant: 'destructive',
          })
        }
      }

      // Broadcast that this tab is active
      const broadcastInterval = setInterval(() => {
        channel.postMessage({ type: 'quiz-active', tabId: Date.now() })
      }, 2000)

      // Cleanup
      return () => {
        clearInterval(broadcastInterval)
        channel.close()
      }
    }
  }, [showPreQuizScreen, attemptData, quizId, toast])

  // Handle Save & Exit
  const handleSaveAndExit = async () => {
    if (!attemptData?.attempt?.id) return
    
    setIsSaving(true)
    try {
      await saveMutation.mutateAsync(answers)
      toast({
        title: 'Progress Saved',
        description: 'Your progress has been saved. You can resume later.',
      })
      router.push('/dashboard/guest/quizzes')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save progress. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Prevent page refresh with warning
  useEffect(() => {
    if (showPreQuizScreen) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(answers).length > 0) {
        e.preventDefault()
        e.returnValue = 'You have unsaved progress. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [answers, showPreQuizScreen])

  if (quizLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const quiz = quizData?.quiz
  if (!quiz) {
    return <div>Quiz not found</div>
  }

  // Check if retries are disabled or max attempts reached
  const completedAttempts = existingAttempts?.attempts?.filter(
    (a: any) => a.status === 'completed'
  ) || []
  const hasCompletedAttempt = completedAttempts.length > 0
  const retriesDisabled = !quiz.settingsAllowRetries
  const maxAttempts = quiz.settingsMaxAttempts
  const maxAttemptsReached = maxAttempts !== null && maxAttempts !== undefined && completedAttempts.length >= maxAttempts

  // Show message if retries disabled or max attempts reached
  if ((retriesDisabled || maxAttemptsReached) && hasCompletedAttempt && showPreQuizScreen) {
    const completedAttempt = existingAttempts?.attempts?.find(
      (a: any) => a.status === 'completed'
    )
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-yellow-500" />
              <h2 className="text-2xl font-bold">Quiz Attempts Exhausted</h2>
              <p className="text-muted-foreground">
                {retriesDisabled 
                  ? 'This quiz allows only one attempt. You have already completed it.'
                  : `You have reached the maximum number of attempts (${maxAttempts}) for this quiz.`
                }
              </p>
              {completedAttempt && (
                <div className="mt-4">
                  <p className="text-lg font-semibold">
                    Your Best Score: {completedAttempt.percentage != null ? Number(completedAttempt.percentage).toFixed(1) : '0.0'}%
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => router.push(`/dashboard/guest/results/${completedAttempt.id}`)}
                  >
                    View Results
                  </Button>
                </div>
              )}
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/dashboard/guest/quizzes')}
              >
                Back to Quizzes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Pre-quiz screen
  if (showPreQuizScreen) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{quiz.title}</CardTitle>
            {quiz.description && (
              <p className="text-muted-foreground mt-2">{quiz.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <FileQuestion className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Questions</div>
                  <div className="font-semibold">{quiz.questionCount}</div>
                </div>
              </div>
              {quiz.settingsTimerSeconds && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Time Limit</div>
                    <div className="font-semibold">
                      {Math.floor(quiz.settingsTimerSeconds / 60)}m
                    </div>
                  </div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">Difficulty</div>
                <Badge className="mt-1 capitalize">
                  {quiz.settingsDifficultyLevel}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Retries</div>
                <div className="font-semibold mt-1">
                  {quiz.settingsAllowRetries 
                    ? (quiz.settingsMaxAttempts 
                        ? `Up to ${quiz.settingsMaxAttempts} attempts` 
                        : 'Unlimited')
                    : 'One attempt only'}
                </div>
                {quiz.settingsAllowRetries && completedAttempts.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {completedAttempts.length} {completedAttempts.length === 1 ? 'attempt' : 'attempts'} used
                    {maxAttempts && ` (${maxAttempts - completedAttempts.length} remaining)`}
                  </div>
                )}
              </div>
            </div>

            {quiz.settingsPassingScore && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium">Passing Score: {Number(quiz.settingsPassingScore)}%</p>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Quiz Rules:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Answer all questions to the best of your ability</li>
                <li>You can navigate between questions using Previous/Next buttons</li>
                {quiz.settingsTimerSeconds && (
                  <li>You have {Math.floor(quiz.settingsTimerSeconds / 60)} minutes to complete the quiz</li>
                )}
                {!quiz.settingsAllowRetries && (
                  <li>This quiz allows only one attempt</li>
                )}
                {quiz.settingsAllowRetries && quiz.settingsMaxAttempts && (
                  <li>Maximum {quiz.settingsMaxAttempts} attempts allowed</li>
                )}
                <li>Your progress will be auto-saved every 30 seconds</li>
                <li>Once submitted, you cannot change your answers</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/guest/quizzes')}
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowPreQuizScreen(false)}
                disabled={attemptLoading}
              >
                {attemptLoading ? 'Starting...' : 'Start Quiz'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (attemptLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const attempt = attemptData?.attempt
  const questions = quiz?.questions || []
  const currentQuestion = questions[currentQuestionIndex]

  if (!attempt || questions.length === 0) {
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
    toast({
      title: 'Time Up!',
      description: 'Your quiz has been automatically submitted.',
    })
    submitMutation.mutate()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{quiz.title}</h1>
        <div className="flex items-center gap-2">
          {timerSeconds && (
            <QuizTimer totalSeconds={timerSeconds} onExpire={handleTimerExpire} />
          )}
          <Button
            variant="outline"
            onClick={handleSaveAndExit}
            disabled={isSaving || saveMutation.isPending}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving || saveMutation.isPending ? 'Saving...' : 'Save & Exit'}
          </Button>
        </div>
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
