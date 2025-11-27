'use client'

import { MCQQuestion } from './MCQQuestion'
import { MultipleSelectQuestion } from './MultipleSelectQuestion'
import { TrueFalseQuestion } from './TrueFalseQuestion'
import { OrderingQuestion } from './OrderingQuestion'
import { FillBlankQuestion } from './FillBlankQuestion'
import { QuestionType } from '@prisma/client'

interface Question {
  id: string
  type: QuestionType
  questionText: string
  points: number
  options?: Array<{ id: string; text: string; isCorrect: boolean }> | null
  correctAnswer?: any
  explanation?: string | null
  imageUrl?: string | null
}

interface QuestionRendererProps {
  question: Question
  value?: any
  onChange?: (value: any) => void
  disabled?: boolean
  showAnswer?: boolean
}

export function QuestionRenderer({
  question,
  value,
  onChange,
  disabled = false,
  showAnswer = false,
}: QuestionRendererProps) {
  const commonProps = {
    question,
    value,
    onChange,
    disabled,
    showAnswer,
  }

  switch (question.type) {
    case 'mcq':
      return <MCQQuestion {...commonProps} />
    case 'multiple_select':
      return <MultipleSelectQuestion {...commonProps} />
    case 'true_false':
      return <TrueFalseQuestion {...commonProps} />
    case 'ordering':
      return <OrderingQuestion {...commonProps} />
    case 'fill_blank':
      return <FillBlankQuestion {...commonProps} />
    default:
      return <div>Unknown question type</div>
  }
}

