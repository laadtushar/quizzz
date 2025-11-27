'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, BookOpen, Target, Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function GuestDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const res = await fetch('/api/users/me/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
  })

  const { data: assignments } = useQuery({
    queryKey: ['assignments', 'my'],
    queryFn: async () => {
      const res = await fetch('/api/assignments/my')
      if (!res.ok) throw new Error('Failed to fetch assignments')
      return res.json()
    },
  })

  if (statsLoading) {
    return <div>Loading...</div>
  }

  const pendingAssignments = assignments?.assignments?.filter(
    (a: any) => a.status === 'pending'
  ) || []

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalXp || 0}</div>
            <p className="text-xs text-muted-foreground">Rank #{stats?.rank || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quizzes Completed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.quizzesCompleted || 0}</div>
            <p className="text-xs text-muted-foreground">Total completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageScore?.toFixed(1) || '0'}%
            </div>
            <p className="text-xs text-muted-foreground">Across all quizzes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalTimeSpent
                ? `${Math.floor(stats.totalTimeSpent / 60)}m`
                : '0m'}
            </div>
            <p className="text-xs text-muted-foreground">Total time</p>
          </CardContent>
        </Card>
      </div>

      {pendingAssignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingAssignments.slice(0, 3).map((assignment: any) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{assignment.quiz.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {assignment.dueDate
                        ? `Due: ${new Date(assignment.dueDate).toLocaleDateString()}`
                        : 'No due date'}
                    </p>
                  </div>
                  <Link href={`/dashboard/guest/quizzes/${assignment.quiz.id}/take`}>
                    <Button size="sm">Start</Button>
                  </Link>
                </div>
              ))}
            </div>
            {pendingAssignments.length > 3 && (
              <Link href="/dashboard/assignments">
                <Button variant="outline" className="w-full mt-4">
                  View All Assignments
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

