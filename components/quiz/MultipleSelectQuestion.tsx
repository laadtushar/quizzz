'use client'

import { Checkbox } from '@/components/ui/checkbox'
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

interface MultipleSelectQuestionProps {
  question: Question
  value?: string[]
  onChange?: (value: string[]) => void
  disabled?: boolean
  showAnswer?: boolean
}

export function MultipleSelectQuestion({
  question,
  value = [],
  onChange,
  disabled = false,
  showAnswer = false,
}: MultipleSelectQuestionProps) {
  const options = question.options || []

  const handleToggle = (optionId: string) => {
    if (disabled) return
    const newValue = value.includes(optionId)
      ? value.filter((id) => id !== optionId)
      : [...value, optionId]
    onChange?.(newValue)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">{question.questionText}</h3>
            <p className="text-sm text-muted-foreground">{question.points} points</p>
          </div>

          <div className="space-y-2">
            {options.map((option) => {
              const isSelected = value.includes(option.id)
              const isCorrect = option.isCorrect
              const showCorrectness = showAnswer && (isSelected || isCorrect)

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
                  <Checkbox
                    id={option.id}
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(option.id)}
                    disabled={disabled}
                  />
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
          </div>

          {showAnswer && value.length > 0 && (() => {
            const selectedOptions = options.filter((opt) => value.includes(opt.id))
            const correctOptions = options.filter((opt) => opt.isCorrect)
            const allCorrect = correctOptions.every((opt) => value.includes(opt.id)) && 
                              selectedOptions.every((opt) => opt.isCorrect) &&
                              selectedOptions.length === correctOptions.length
            return !allCorrect ? (
              <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm font-medium mb-2 text-blue-900">Correct Answer(s):</p>
                <div className="text-sm text-blue-800 space-y-1">
                  {correctOptions.map((opt) => (
                    <div key={opt.id}>• {opt.text}</div>
                  ))}
                </div>
              </div>
            ) : null
          })()}

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


