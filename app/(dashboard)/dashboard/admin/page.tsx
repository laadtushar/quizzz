'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Users, FileQuestion, CheckCircle2, TrendingUp, Clock, Plus, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/admin/analytics')
      if (!res.ok) throw new Error('Failed to fetch analytics')
      return res.json()
    },
  })

  const { data: assignmentsData } = useQuery({
    queryKey: ['assignments', 'admin', 'pending'],
    queryFn: async () => {
      const res = await fetch('/api/assignments?status=pending')
      if (!res.ok) return { assignments: [] }
      return res.json()
    },
  })

  const { data: recentQuizzes } = useQuery({
    queryKey: ['quizzes', 'admin', 'recent'],
    queryFn: async () => {
      const res = await fetch('/api/quizzes')
      if (!res.ok) return { quizzes: [] }
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const pendingAssignments = assignmentsData?.assignments?.slice(0, 5) || []
  const recentQuizzesList = recentQuizzes?.quizzes?.slice(0, 5) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your quiz platform</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/admin/quizzes/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Quiz
            </Button>
          </Link>
          <Link href="/dashboard/admin/assignments/create">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Assign Quiz
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Quizzes</CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalQuizzes || 0}</div>
            <p className="text-xs text-muted-foreground">Active quizzes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalAttempts || 0}</div>
            <p className="text-xs text-muted-foreground">Completed attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.averageScore?.toFixed(1) || '0.0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Completion: {data?.completionRate?.toFixed(1) || '0.0'}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/admin/quizzes/create" className="block">
              <Button variant="outline" className="w-full justify-start">
                <FileQuestion className="mr-2 h-4 w-4" />
                Create New Quiz
              </Button>
            </Link>
            <Link href="/dashboard/admin/assignments/create" className="block">
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Assign Quiz
              </Button>
            </Link>
            <Link href="/dashboard/admin/analytics" className="block">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </Link>
            <Link href="/dashboard/admin/users" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Pending Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingAssignments.length > 0 ? (
              <div className="space-y-3">
                {pendingAssignments.map((assignment: any) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {assignment.quiz.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {assignment.user.displayName}
                      </p>
                      {assignment.dueDate && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {assignment.status}
                    </Badge>
                  </div>
                ))}
                <Link href="/dashboard/admin/assignments">
                  <Button variant="ghost" className="w-full text-sm">
                    View All Assignments
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No pending assignments</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Quiz Creations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentQuizzesList.length > 0 ? (
              <div className="space-y-3">
                {recentQuizzesList.map((quiz: any) => (
                  <Link
                    key={quiz.id}
                    href={`/dashboard/admin/quizzes/${quiz.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{quiz.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(quiz.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <Badge
                        variant={quiz.status === 'published' ? 'default' : 'secondary'}
                        className="ml-2"
                      >
                        {quiz.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
                <Link href="/dashboard/admin/quizzes">
                  <Button variant="ghost" className="w-full text-sm">
                    View All Quizzes
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileQuestion className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No quizzes yet</p>
                <Link href="/dashboard/admin/quizzes/create">
                  <Button variant="outline" size="sm" className="mt-2">
                    Create First Quiz
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.recentAttempts && data.recentAttempts.length > 0 ? (
            <div className="space-y-3">
              {data.recentAttempts.slice(0, 10).map((attempt: any) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">
                        {attempt.userName} completed {attempt.quizTitle}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(attempt.completedAt), 'PPp')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{attempt.score.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
