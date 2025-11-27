'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

export default function MyAssignmentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['assignments', 'my'],
    queryFn: async () => {
      const res = await fetch('/api/assignments/my')
      if (!res.ok) throw new Error('Failed to fetch assignments')
      return res.json()
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  const assignments = data?.assignments || []

  const getStatusBadge = (status: string, dueDate?: string | null) => {
    if (status === 'completed') {
      return <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">Completed</span>
    }
    if (status === 'overdue') {
      return <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">Overdue</span>
    }
    if (dueDate && new Date(dueDate) < new Date()) {
      return <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">Overdue</span>
    }
    return <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">Pending</span>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Assignments</h1>

      <div className="space-y-4">
        {assignments.map((assignment: any) => (
          <Card key={assignment.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{assignment.quiz.title}</CardTitle>
                  {assignment.quiz.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {assignment.quiz.description}
                    </p>
                  )}
                </div>
                {getStatusBadge(assignment.status, assignment.dueDate)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {assignment.dueDate
                    ? `Due: ${format(new Date(assignment.dueDate), 'PPp')}`
                    : 'No due date'}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {assignment.quiz.questionCount} questions
                </div>
                <div className="text-sm text-muted-foreground">
                  Assigned by: {assignment.assigner.displayName}
                </div>
              </div>
              <Link href={`/dashboard/guest/quizzes/${assignment.quiz.id}/take`}>
                <Button className="w-full">
                  {assignment.status === 'completed' ? 'View Results' : 'Start Quiz'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {assignments.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No assignments yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

