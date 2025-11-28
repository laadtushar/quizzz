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
  options?: Array<{ id: string; text: string; isCorrect: boolean }> | null
  correctAnswer?: any
  explanation?: string | null
}

interface MCQQuestionProps {
  question: Question
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  showAnswer?: boolean
}

export function MCQQuestion({
  question,
  value,
  onChange,
  disabled = false,
  showAnswer = false,
}: MCQQuestionProps) {
  const options = question.options || []

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">{question.questionText}</h3>
            <p className="text-sm text-muted-foreground">{question.points} points</p>
          </div>

          <RadioGroup
            value={value}
            onValueChange={onChange}
            disabled={disabled}
            className="space-y-2"
          >
            {options.map((option) => {
              const isSelected = value === option.id
              const isCorrect = option.isCorrect
              const showCorrectness = showAnswer && isSelected

              return (
                <div
                  key={option.id}
                  className={cn(
                    'flex items-center space-x-2 rounded-lg border p-3',
                    showAnswer && isSelected && isCorrect && 'border-green-500 bg-green-50',
                    showAnswer && isSelected && !isCorrect && 'border-red-500 bg-red-50',
                    showAnswer && !isSelected && isCorrect && 'border-green-500 bg-green-50'
                  )}
                >
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label
                    htmlFor={option.id}
                    className="flex-1 cursor-pointer font-normal"
                  >
                    {option.text}
                  </Label>
                  {showAnswer && (
                    <>
                      {isSelected && isCorrect && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      {isSelected && !isCorrect && (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      {!isSelected && isCorrect && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                    </>
                  )}
                </div>
              )
            })}
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


