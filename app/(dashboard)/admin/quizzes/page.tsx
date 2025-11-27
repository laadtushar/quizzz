'use client'

import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Plus, FileQuestion } from 'lucide-react'

export default function AdminQuizzesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['quizzes', 'admin'],
    queryFn: async () => {
      const res = await fetch('/api/quizzes')
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quizzes</h1>
        <Link href="/dashboard/admin/quizzes/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Quiz
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz: any) => (
          <Card key={quiz.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileQuestion className="h-5 w-5" />
                {quiz.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {quiz.description || 'No description'}
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {quiz._count?.questions || 0} questions
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  quiz.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {quiz.status}
                </span>
              </div>
              <Link href={`/dashboard/admin/quizzes/${quiz.id}`}>
                <Button variant="outline" className="w-full mt-4">
                  Edit Quiz
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {quizzes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No quizzes yet. Create your first quiz!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

