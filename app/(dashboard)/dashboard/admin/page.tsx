'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileQuestion, CheckCircle2, TrendingUp } from 'lucide-react'

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/admin/analytics')
      if (!res.ok) throw new Error('Failed to fetch analytics')
      return res.json()
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Quizzes</CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalQuizzes || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalAttempts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.averageScore?.toFixed(1) || '0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Completion: {data?.completionRate?.toFixed(1) || '0'}%
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

