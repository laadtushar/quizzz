'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowUp, ArrowDown, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Question {
  id: string
  questionText: string
  points: number
  options?: Array<{ id: string; text: string }> | null
  correctAnswer?: string[]
  explanation?: string | null
}

interface OrderingQuestionProps {
  question: Question
  value?: string[]
  onChange?: (value: string[]) => void
  disabled?: boolean
  showAnswer?: boolean
}

export function OrderingQuestion({
  question,
  value = [],
  onChange,
  disabled = false,
  showAnswer = false,
}: OrderingQuestionProps) {
  const options = question.options || []
  const currentOrder = value.length > 0 ? value : options.map((o) => o.id)

  const moveUp = (index: number) => {
    if (disabled || index === 0) return
    const newOrder = [...currentOrder]
    ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
    onChange?.(newOrder)
  }

  const moveDown = (index: number) => {
    if (disabled || index === currentOrder.length - 1) return
    const newOrder = [...currentOrder]
    ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
    onChange?.(newOrder)
  }

  const correctOrder = question.correctAnswer || []
  const isCorrect = showAnswer && JSON.stringify(currentOrder) === JSON.stringify(correctOrder)

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">{question.questionText}</h3>
            <p className="text-sm text-muted-foreground">{question.points} points</p>
            <p className="text-sm text-muted-foreground mt-1">
              Arrange the items in the correct order
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Your Answer:</p>
            {currentOrder.map((optionId, index) => {
              const option = options.find((o) => o.id === optionId)
              if (!option) return null
              
              const correctIndex = correctOrder.indexOf(optionId)
              const isInCorrectPosition = showAnswer && correctIndex === index

              return (
                <div
                  key={optionId}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border p-3',
                    showAnswer && isInCorrectPosition && 'border-green-500 bg-green-50',
                    showAnswer && !isInCorrectPosition && 'border-red-500 bg-red-50'
                  )}
                >
                  <span className="text-sm font-medium text-muted-foreground w-8">
                    {index + 1}.
                  </span>
                  <span className="flex-1">{option.text}</span>
                  {showAnswer && (
                    <>
                      {isInCorrectPosition ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </>
                  )}
                  {!disabled && (
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => moveDown(index)}
                        disabled={index === currentOrder.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {showAnswer && !isCorrect && correctOrder.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-green-600">Correct Answer:</p>
              <div className="space-y-2">
                {correctOrder.map((optionId, index) => {
                  const option = options.find((o) => o.id === optionId)
                  if (!option) return null
                  return (
                    <div
                      key={optionId}
                      className="flex items-center gap-2 rounded-lg border border-green-500 bg-green-50 p-3"
                    >
                      <span className="text-sm font-medium text-muted-foreground w-8">
                        {index + 1}.
                      </span>
                      <span className="flex-1">{option.text}</span>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

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


