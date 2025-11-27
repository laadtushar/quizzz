'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface TrueFalseEditorProps {
  questionText: string
  points: number
  correctAnswer?: boolean
  explanation?: string
  imageUrl?: string
  onChange: (data: {
    questionText: string
    points: number
    correctAnswer: boolean
    explanation?: string
    imageUrl?: string
  }) => void
}

export function TrueFalseEditor({
  questionText: initialQuestionText,
  points: initialPoints,
  correctAnswer: initialCorrectAnswer,
  explanation: initialExplanation,
  imageUrl: initialImageUrl,
  onChange,
}: TrueFalseEditorProps) {
  const [questionText, setQuestionText] = useState(initialQuestionText)
  const [points, setPoints] = useState(initialPoints)
  const [correctAnswer, setCorrectAnswer] = useState(
    initialCorrectAnswer ?? true
  )
  const [explanation, setExplanation] = useState(initialExplanation || '')
  const [imageUrl, setImageUrl] = useState(initialImageUrl || '')

  useEffect(() => {
    onChange({
      questionText,
      points,
      correctAnswer,
      explanation,
      imageUrl,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionText, points, correctAnswer, explanation, imageUrl])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="questionText">Question Text *</Label>
        <Textarea
          id="questionText"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Enter your true/false question"
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
        <Label>Correct Answer *</Label>
        <div className="flex gap-4">
          <Card
            className={`cursor-pointer transition-colors ${
              correctAnswer === true
                ? 'border-primary bg-primary/5'
                : 'hover:bg-muted'
            }`}
            onClick={() => setCorrectAnswer(true)}
          >
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">True</div>
                {correctAnswer === true && (
                  <div className="text-sm text-primary">Correct Answer</div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-colors ${
              correctAnswer === false
                ? 'border-primary bg-primary/5'
                : 'hover:bg-muted'
            }`}
            onClick={() => setCorrectAnswer(false)}
          >
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">False</div>
                {correctAnswer === false && (
                  <div className="text-sm text-primary">Correct Answer</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
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

