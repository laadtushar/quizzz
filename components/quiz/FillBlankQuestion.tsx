'use client'

import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Question {
  id: string
  questionText: string
  points: number
  correctAnswer?: string
  explanation?: string | null
}

interface FillBlankQuestionProps {
  question: Question
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  showAnswer?: boolean
}

export function FillBlankQuestion({
  question,
  value = '',
  onChange,
  disabled = false,
  showAnswer = false,
}: FillBlankQuestionProps) {
  const isCorrect = showAnswer && value.trim().toLowerCase() === String(question.correctAnswer || '').trim().toLowerCase()

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">{question.questionText}</h3>
            <p className="text-sm text-muted-foreground">{question.points} points</p>
          </div>

          <div className="space-y-2">
            <Input
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              disabled={disabled}
              placeholder="Enter your answer"
              className={cn(
                showAnswer && isCorrect && 'border-green-500 bg-green-50',
                showAnswer && !isCorrect && value && 'border-red-500 bg-red-50'
              )}
            />
            {showAnswer && (
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-600">Correct!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="text-sm text-red-600">
                      Correct answer: {question.correctAnswer}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {showAnswer && question.explanation && (
            <div className="mt-4 rounded-lg bg-muted p-4">
              <p className="text-sm font-medium mb-1">Explanation:</p>
              <p className="text-sm text-muted-foreground">{question.explanation}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


