'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'

interface FillBlankEditorProps {
  questionText: string
  points: number
  correctAnswer?: string | string[]
  explanation?: string
  imageUrl?: string
  onChange: (data: {
    questionText: string
    points: number
    correctAnswer: string | string[]
    explanation?: string
    imageUrl?: string
  }) => void
}

export function FillBlankEditor({
  questionText: initialQuestionText,
  points: initialPoints,
  correctAnswer: initialCorrectAnswer,
  explanation: initialExplanation,
  imageUrl: initialImageUrl,
  onChange,
}: FillBlankEditorProps) {
  const [questionText, setQuestionText] = useState(initialQuestionText)
  const [points, setPoints] = useState(initialPoints)
  const [correctAnswer, setCorrectAnswer] = useState<string>(
    Array.isArray(initialCorrectAnswer)
      ? initialCorrectAnswer.join(', ')
      : initialCorrectAnswer || ''
  )
  const [explanation, setExplanation] = useState(initialExplanation || '')
  const [imageUrl, setImageUrl] = useState(initialImageUrl || '')

  useEffect(() => {
    // Parse correct answer - if comma-separated, convert to array
    const answer = correctAnswer.includes(',')
      ? correctAnswer.split(',').map((a) => a.trim()).filter((a) => a)
      : correctAnswer

    onChange({
      questionText,
      points,
      correctAnswer: answer,
      explanation,
      imageUrl,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionText, points, correctAnswer, explanation, imageUrl])

  // Detect brackets in question text
  const detectedBlanks = questionText.match(/\[([^\]]+)\]/g) || []
  const hasBrackets = detectedBlanks.length > 0

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="questionText">Question Text *</Label>
        <Textarea
          id="questionText"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder='Enter your question with blanks marked as [answer] or use underscores'
          rows={4}
        />
        {hasBrackets && (
          <Card className="bg-muted">
            <CardContent className="pt-4">
              <p className="text-sm font-medium mb-2">Detected blanks:</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                {detectedBlanks.map((blank, idx) => (
                  <li key={idx}>{blank}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        <p className="text-sm text-muted-foreground">
          Use brackets like [answer] to mark blanks, or specify answers below
        </p>
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
        <Label htmlFor="correctAnswer">Correct Answer(s) *</Label>
        <Input
          id="correctAnswer"
          value={correctAnswer}
          onChange={(e) => setCorrectAnswer(e.target.value)}
          placeholder="Enter correct answer(s), comma-separated for multiple"
        />
        <p className="text-sm text-muted-foreground">
          For multiple blanks, separate answers with commas
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="explanation">Explanation</Label>
        <Textarea
          id="explanation"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Explain the correct answer"
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

