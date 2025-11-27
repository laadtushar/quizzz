'use client'

import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'

export default function GuestQuizzesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['quizzes', 'visible'],
    queryFn: async () => {
      const res = await fetch('/api/quizzes/visible')
      if (!res.ok) throw new Error('Failed to fetch quizzes')
      return res.json()
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  const quizzes = data?.quizzes || []

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Available Quizzes</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz: any) => (
          <Card key={quiz.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {quiz.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {quiz.description || 'No description'}
              </p>
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-muted-foreground">
                  {quiz._count?.questions || 0} questions
                </span>
                <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                  {quiz.settingsDifficultyLevel}
                </span>
              </div>
              <Link href={`/dashboard/guest/quizzes/${quiz.id}/take`}>
                <Button className="w-full">Start Quiz</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {quizzes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No quizzes available yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

