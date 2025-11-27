'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Plus, Trash2, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Option {
  id: string
  text: string
  isCorrect: boolean
}

interface MCQEditorProps {
  questionText: string
  points: number
  options: Option[]
  correctAnswer?: string
  explanation?: string
  imageUrl?: string
  onChange: (data: {
    questionText: string
    points: number
    options: Option[]
    correctAnswer: string
    explanation?: string
    imageUrl?: string
  }) => void
}

export function MCQEditor({
  questionText: initialQuestionText,
  points: initialPoints,
  options: initialOptions,
  correctAnswer: initialCorrectAnswer,
  explanation: initialExplanation,
  imageUrl: initialImageUrl,
  onChange,
}: MCQEditorProps) {
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
  const [correctAnswer, setCorrectAnswer] = useState(
    initialCorrectAnswer || ''
  )
  const [explanation, setExplanation] = useState(initialExplanation || '')
  const [imageUrl, setImageUrl] = useState(initialImageUrl || '')

  useEffect(() => {
    onChange({
      questionText,
      points,
      options,
      correctAnswer,
      explanation,
      imageUrl,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionText, points, options, correctAnswer, explanation, imageUrl])

  const addOption = () => {
    const newId = String(Date.now())
    setOptions([...options, { id: newId, text: '', isCorrect: false }])
  }

  const removeOption = (id: string) => {
    if (options.length <= 2) return
    const newOptions = options.filter((opt) => opt.id !== id)
    setOptions(newOptions)
    if (correctAnswer === id) {
      setCorrectAnswer('')
    }
  }

  const updateOption = (id: string, field: 'text' | 'isCorrect', value: string | boolean) => {
    const newOptions = options.map((opt) =>
      opt.id === id ? { ...opt, [field]: value } : { ...opt, isCorrect: false }
    )
    setOptions(newOptions)
    if (field === 'isCorrect' && value === true) {
      setCorrectAnswer(id)
    }
  }

  const handleCorrectAnswerChange = (value: string) => {
    setCorrectAnswer(value)
    setOptions(
      options.map((opt) => ({
        ...opt,
        isCorrect: opt.id === value,
      }))
    )
  }

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
          <Label>Options *</Label>
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
        <RadioGroup value={correctAnswer} onValueChange={handleCorrectAnswerChange}>
          {options.map((option, index) => (
            <Card key={option.id}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <RadioGroupItem
                    value={option.id}
                    id={`option-${option.id}`}
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
        </RadioGroup>
        {correctAnswer && (
          <p className="text-sm text-muted-foreground">
            Correct answer: {options.find((o) => o.id === correctAnswer)?.text || 'Not set'}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="explanation">Explanation</Label>
        <Textarea
          id="explanation"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Explain why this is the correct answer"
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

