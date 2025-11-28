'use client'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Question {
  id: string
  questionText: string
  points: number
  correctAnswer?: boolean
  explanation?: string | null
}

interface TrueFalseQuestionProps {
  question: Question
  value?: boolean
  onChange?: (value: boolean) => void
  disabled?: boolean
  showAnswer?: boolean
}

export function TrueFalseQuestion({
  question,
  value,
  onChange,
  disabled = false,
  showAnswer = false,
}: TrueFalseQuestionProps) {
  const handleChange = (val: string) => {
    onChange?.(val === 'true')
  }

  const isCorrect = value === question.correctAnswer
  const showCorrectness = showAnswer && value !== undefined

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">{question.questionText}</h3>
            <p className="text-sm text-muted-foreground">{question.points} points</p>
          </div>

          <RadioGroup
            value={value === undefined ? undefined : value.toString()}
            onValueChange={handleChange}
            disabled={disabled}
            className="space-y-2"
          >
            <div
              className={cn(
                'flex items-center space-x-2 rounded-lg border p-3',
                showAnswer && value === true && isCorrect && 'border-green-500 bg-green-50',
                showAnswer && value === true && !isCorrect && 'border-red-500 bg-red-50',
                showAnswer && question.correctAnswer === true && value !== true && 'border-green-500 bg-green-50'
              )}
            >
              <RadioGroupItem value="true" id="true" />
              <Label htmlFor="true" className="flex-1 cursor-pointer font-normal">
                True
              </Label>
              {showAnswer && (
                <>
                  {value === true && isCorrect && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  {value === true && !isCorrect && (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  {question.correctAnswer === true && value !== true && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </>
              )}
            </div>

            <div
              className={cn(
                'flex items-center space-x-2 rounded-lg border p-3',
                showAnswer && value === false && isCorrect && 'border-green-500 bg-green-50',
                showAnswer && value === false && !isCorrect && 'border-red-500 bg-red-50',
                showAnswer && question.correctAnswer === false && value !== false && 'border-green-500 bg-green-50'
              )}
            >
              <RadioGroupItem value="false" id="false" />
              <Label htmlFor="false" className="flex-1 cursor-pointer font-normal">
                False
              </Label>
              {showAnswer && (
                <>
                  {value === false && isCorrect && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  {value === false && !isCorrect && (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  {question.correctAnswer === false && value !== false && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </>
              )}
            </div>
          </RadioGroup>

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


