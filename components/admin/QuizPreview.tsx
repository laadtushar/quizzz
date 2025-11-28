'use client'

import { QuestionRenderer } from '@/components/quiz/QuestionRenderer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { QuestionType } from '@prisma/client'

interface Question {
  id: string
  orderIndex: number
  type: QuestionType
  questionText: string
  points: number
  options?: Array<{ id: string; text: string; isCorrect: boolean }> | null
  correctAnswer?: any
  explanation?: string | null
  imageUrl?: string | null
}

interface QuizPreviewProps {
  quiz: {
    title: string
    description?: string | null
    settingsTimerSeconds?: number | null
    settingsAllowRetries: boolean
    settingsDifficultyLevel: string
    settingsPassingScore?: number | null
  }
  questions: Question[]
}

export function QuizPreview({ quiz, questions }: QuizPreviewProps) {
  const sortedQuestions = [...questions].sort((a, b) => a.orderIndex - b.orderIndex)

  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{quiz.title}</CardTitle>
          {quiz.description && (
            <p className="text-muted-foreground mt-2">{quiz.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 items-center">
            <Badge className={difficultyColors[quiz.settingsDifficultyLevel] || 'bg-gray-100 text-gray-800'}>
              {quiz.settingsDifficultyLevel}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {sortedQuestions.length} question(s)
            </span>
            <span className="text-sm text-muted-foreground">
              {sortedQuestions.reduce((sum, q) => sum + q.points, 0)} total points
            </span>
            {quiz.settingsTimerSeconds && (
              <span className="text-sm text-muted-foreground">
                {Math.floor(quiz.settingsTimerSeconds / 60)} minute(s) time limit
              </span>
            )}
            {!quiz.settingsAllowRetries && (
              <Badge variant="outline">One attempt only</Badge>
            )}
            {quiz.settingsPassingScore && (
              <span className="text-sm text-muted-foreground">
                Passing score: {Number(quiz.settingsPassingScore)}%
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="space-y-6">
        {sortedQuestions.map((question, index) => (
          <div key={question.id} className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Question {index + 1} of {sortedQuestions.length}
              </span>
              <Badge variant="outline">{question.points} points</Badge>
            </div>
            <QuestionRenderer
              question={{
                id: question.id,
                type: question.type,
                questionText: question.questionText,
                points: question.points,
                options: question.options || null,
                correctAnswer: question.correctAnswer,
                explanation: question.explanation || null,
                imageUrl: question.imageUrl || null,
              }}
              disabled={true}
              showAnswer={true}
            />
            {question.explanation && (
              <Card className="bg-muted">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium mb-1">Explanation:</p>
                  <p className="text-sm text-muted-foreground">
                    {question.explanation}
                  </p>
                </CardContent>
              </Card>
            )}
            {index < sortedQuestions.length - 1 && <Separator className="my-6" />}
          </div>
        ))}
      </div>

      {sortedQuestions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No questions in this quiz yet. Add questions to see the preview.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


