'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MCQEditor } from './question-editors/MCQEditor'
import { MultipleSelectEditor } from './question-editors/MultipleSelectEditor'
import { TrueFalseEditor } from './question-editors/TrueFalseEditor'
import { OrderingEditor } from './question-editors/OrderingEditor'
import { FillBlankEditor } from './question-editors/FillBlankEditor'
import { QuestionType } from '@prisma/client'

interface QuestionData {
  type: QuestionType
  questionText: string
  points: number
  options?: Array<{ id: string; text: string; isCorrect: boolean }>
  correctAnswer: any
  explanation?: string
  imageUrl?: string
}

interface QuestionEditorProps {
  type: QuestionType
  initialData?: Partial<QuestionData>
  onChange: (data: QuestionData) => void
}

export function QuestionEditor({
  type: initialType,
  initialData,
  onChange,
}: QuestionEditorProps) {
  const [type, setType] = useState<QuestionType>(initialType || 'mcq')
  const [data, setData] = useState<QuestionData>({
    type: initialType || 'mcq',
    questionText: initialData?.questionText || '',
    points: initialData?.points || 10,
    options: initialData?.options || [],
    correctAnswer: initialData?.correctAnswer || '',
    explanation: initialData?.explanation || '',
    imageUrl: initialData?.imageUrl || '',
  })

  // Sync with initialData when it changes (e.g., when dialog opens with new question)
  useEffect(() => {
    if (initialData) {
      setData({
        type: initialType || 'mcq',
        questionText: initialData.questionText || '',
        points: initialData.points || 10,
        options: initialData.options || [],
        correctAnswer: initialData.correctAnswer || '',
        explanation: initialData.explanation || '',
        imageUrl: initialData.imageUrl || '',
      })
      setType(initialType || 'mcq')
    }
  }, [initialData, initialType])

  useEffect(() => {
    setData((prev) => ({ ...prev, type }))
  }, [type])

  useEffect(() => {
    onChange(data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const handleEditorChange = (editorData: any) => {
    setData((prev) => ({
      ...prev,
      ...editorData,
      type,
    }))
  }

  const renderEditor = () => {
    const commonProps = {
      questionText: data.questionText,
      points: data.points,
      explanation: data.explanation,
      imageUrl: data.imageUrl,
      onChange: handleEditorChange,
    }

    switch (type) {
      case 'mcq':
        return (
          <MCQEditor
            {...commonProps}
            options={data.options || []}
            correctAnswer={data.correctAnswer}
          />
        )
      case 'multiple_select':
        return (
          <MultipleSelectEditor
            {...commonProps}
            options={data.options || []}
            correctAnswer={Array.isArray(data.correctAnswer) ? data.correctAnswer : []}
          />
        )
      case 'true_false':
        return (
          <TrueFalseEditor
            {...commonProps}
            correctAnswer={data.correctAnswer}
          />
        )
      case 'ordering':
        return (
          <OrderingEditor
            {...commonProps}
            options={
              data.options?.map((opt) => ({ id: opt.id, text: opt.text })) || []
            }
            correctAnswer={Array.isArray(data.correctAnswer) ? data.correctAnswer : []}
          />
        )
      case 'fill_blank':
        return (
          <FillBlankEditor
            {...commonProps}
            correctAnswer={data.correctAnswer}
          />
        )
      default:
        return <div>Unknown question type</div>
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Question Type *</label>
        <Select
          value={type}
          onValueChange={(value) => setType(value as QuestionType)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mcq">Multiple Choice (Single Answer)</SelectItem>
            <SelectItem value="multiple_select">Multiple Select</SelectItem>
            <SelectItem value="true_false">True/False</SelectItem>
            <SelectItem value="ordering">Ordering</SelectItem>
            <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {renderEditor()}
    </div>
  )
}

