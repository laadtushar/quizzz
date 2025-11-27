'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { QuestionEditor } from './QuestionEditor'
import { QuestionType } from '@prisma/client'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

interface Question {
  id?: string
  type: QuestionType
  questionText: string
  points: number
  options?: Array<{ id: string; text: string; isCorrect: boolean }> | null
  correctAnswer: any
  explanation?: string | null
  imageUrl?: string | null
}

interface QuestionEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quizId: string
  question?: Question | null
  onSuccess?: () => void
}

export function QuestionEditorDialog({
  open,
  onOpenChange,
  quizId,
  question,
  onSuccess,
}: QuestionEditorDialogProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [questionData, setQuestionData] = useState<Question | null>(null)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    if (open) {
      if (question) {
        setQuestionData(question)
      } else {
        setQuestionData({
          type: 'mcq',
          questionText: '',
          points: 10,
          options: [],
          correctAnswer: '',
        })
      }
      setIsValid(false)
    }
  }, [open, question])

  const validateQuestion = (data: Question): boolean => {
    if (!data.questionText.trim()) return false
    if (data.points < 1) return false

    if (data.type === 'mcq' || data.type === 'multiple_select') {
      if (!data.options || data.options.length < 2) return false
      if (data.options.some((opt) => !opt.text.trim())) return false
      const hasCorrect = data.options.some((opt) => opt.isCorrect)
      if (!hasCorrect) return false
    }

    if (data.type === 'ordering') {
      if (!data.options || data.options.length < 2) return false
      if (data.options.some((opt) => !opt.text.trim())) return false
    }

    if (data.type === 'fill_blank') {
      if (!data.correctAnswer || (typeof data.correctAnswer === 'string' && !data.correctAnswer.trim())) {
        return false
      }
    }

    return true
  }

  const handleSave = async () => {
    if (!questionData || !validateQuestion(questionData)) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields correctly.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const url = question?.id
        ? `/api/quizzes/${quizId}/questions/${question.id}`
        : `/api/quizzes/${quizId}/questions`

      const method = question?.id ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: questionData.type,
          questionText: questionData.questionText,
          points: questionData.points,
          options: questionData.options || null,
          correctAnswer: questionData.correctAnswer,
          explanation: questionData.explanation || null,
          imageUrl: questionData.imageUrl || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save question')
      }

      toast({
        title: 'Success',
        description: question?.id
          ? 'Question updated successfully'
          : 'Question created successfully',
      })

      // Close dialog first, then call onSuccess
      onOpenChange(false)
      // Use setTimeout to ensure dialog closes before refreshing
      setTimeout(() => {
        onSuccess?.()
      }, 100)
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to save question',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!questionData) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {question?.id ? 'Edit Question' : 'Add New Question'}
          </DialogTitle>
          <DialogDescription>
            {question?.id
              ? 'Update the question details below'
              : 'Create a new question for this quiz'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <QuestionEditor
            key={question?.id || 'new'}
            type={questionData.type}
            initialData={questionData}
            onChange={(data) => {
              setQuestionData(data as Question)
              setIsValid(validateQuestion(data as Question))
            }}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !isValid}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {question?.id ? 'Update' : 'Create'} Question
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

