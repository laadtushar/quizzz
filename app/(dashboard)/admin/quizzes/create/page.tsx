'use client'

import { QuizGenerator } from '@/components/admin/QuizGenerator'

export default function CreateQuizPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create Quiz</h1>
      <QuizGenerator />
    </div>
  )
}

