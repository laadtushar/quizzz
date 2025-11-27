'use client'

import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AssignmentCreator } from '@/components/admin/AssignmentCreator'
import { format } from 'date-fns'
import Link from 'next/link'

export default function AdminAssignmentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['assignments', 'admin'],
    queryFn: async () => {
      const res = await fetch('/api/assignments')
      if (!res.ok) throw new Error('Failed to fetch assignments')
      return res.json()
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  const assignments = data?.assignments || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Assignments</h1>
        <Link href="/dashboard/admin/assignments/create">
          <Button>Create Assignment</Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">All Assignments</h2>
          <div className="space-y-4">
            {assignments.map((assignment: any) => (
              <Card key={assignment.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{assignment.quiz.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Assigned to:</span>{' '}
                      {assignment.user.displayName}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{' '}
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          assignment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : assignment.status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {assignment.status}
                      </span>
                    </div>
                    {assignment.dueDate && (
                      <div>
                        <span className="font-medium">Due:</span>{' '}
                        {format(new Date(assignment.dueDate), 'PPp')}
                      </div>
                    )}
                    {assignment.score !== null && (
                      <div>
                        <span className="font-medium">Score:</span> {assignment.score}%
                      </div>
                    )}
                  </div>
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

        <div>
          <h2 className="text-xl font-semibold mb-4">Create New Assignment</h2>
          <AssignmentCreator />
        </div>
      </div>
    </div>
  )
}
