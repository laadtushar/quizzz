'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, FileQuestion, Trophy } from 'lucide-react'

export default function QuizDetailsPage() {
  const params = useParams()
  const quizId = params.quizId as string

  const { data, isLoading } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const res = await fetch(`/api/quizzes/${quizId}`)
      if (!res.ok) throw new Error('Failed to fetch quiz')
      return res.json()
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  const quiz = data?.quiz
  if (!quiz) {
    return <div>Quiz not found</div>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{quiz.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {quiz.description && (
            <p className="text-muted-foreground">{quiz.description}</p>
          )}

          <div className="grid grid-cols-3 gap-4">
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
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Difficulty</div>
                <div className="font-semibold capitalize">
                  {quiz.settingsDifficultyLevel}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Link href={`/dashboard/guest/quizzes/${quizId}/take`}>
              <Button className="w-full">Start Quiz</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

