'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Option {
  id: string
  text: string
  isCorrect: boolean
}

interface MultipleSelectEditorProps {
  questionText: string
  points: number
  options: Option[]
  correctAnswer?: string[]
  explanation?: string
  imageUrl?: string
  onChange: (data: {
    questionText: string
    points: number
    options: Option[]
    correctAnswer: string[]
    explanation?: string
    imageUrl?: string
  }) => void
}

export function MultipleSelectEditor({
  questionText: initialQuestionText,
  points: initialPoints,
  options: initialOptions,
  correctAnswer: initialCorrectAnswer,
  explanation: initialExplanation,
  imageUrl: initialImageUrl,
  onChange,
}: MultipleSelectEditorProps) {
  const [questionText, setQuestionText] = useState(initialQuestionText)
  const [points, setPoints] = useState(initialPoints)
  const [options, setOptions] = useState<Option[]>(
    initialOptions.length > 0
      ? initialOptions
      : [
          { id: '1', text: '', isCorrect: false },
          { id: '2', text: '', isCorrect: false },
        ]
  )
  const [explanation, setExplanation] = useState(initialExplanation || '')
  const [imageUrl, setImageUrl] = useState(initialImageUrl || '')

  useEffect(() => {
    const correctAnswers = options.filter((opt) => opt.isCorrect).map((opt) => opt.id)
    onChange({
      questionText,
      points,
      options,
      correctAnswer: correctAnswers,
      explanation,
      imageUrl,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionText, points, options, explanation, imageUrl])

  useEffect(() => {
    if (initialCorrectAnswer && initialCorrectAnswer.length > 0 && initialOptions.length > 0) {
      setOptions(
        initialOptions.map((opt) => ({
          ...opt,
          isCorrect: initialCorrectAnswer.includes(opt.id),
        }))
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only on mount

  const addOption = () => {
    const newId = String(Date.now())
    setOptions([...options, { id: newId, text: '', isCorrect: false }])
  }

  const removeOption = (id: string) => {
    if (options.length <= 2) return
    setOptions(options.filter((opt) => opt.id !== id))
  }

  const updateOption = (id: string, field: 'text' | 'isCorrect', value: string | boolean) => {
    setOptions(
      options.map((opt) =>
        opt.id === id ? { ...opt, [field]: value } : opt
      )
    )
  }

  const correctCount = options.filter((opt) => opt.isCorrect).length

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="questionText">Question Text *</Label>
        <Textarea
          id="questionText"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Enter your question"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="points">Points *</Label>
        <Input
          id="points"
          type="number"
          min="1"
          value={points}
          onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Options * (Select multiple correct answers)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addOption}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Option
          </Button>
        </div>
        {options.map((option, index) => (
          <Card key={option.id}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id={`option-${option.id}`}
                  checked={option.isCorrect}
                  onCheckedChange={(checked) =>
                    updateOption(option.id, 'isCorrect', checked === true)
                  }
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option.text}
                    onChange={(e) =>
                      updateOption(option.id, 'text', e.target.value)
                    }
                  />
                </div>
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(option.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {correctCount > 0 && (
          <p className="text-sm text-muted-foreground">
            {correctCount} correct answer(s) selected
          </p>
        )}
        {correctCount === 0 && (
          <p className="text-sm text-destructive">
            At least one correct answer is required
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="explanation">Explanation</Label>
        <Textarea
          id="explanation"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Explain the correct answers"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">Image URL (optional)</Label>
        <Input
          id="imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      </div>
    </div>
  )
}

