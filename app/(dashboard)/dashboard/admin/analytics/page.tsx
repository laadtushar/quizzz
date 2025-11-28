'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Users, FileQuestion, CheckCircle2, TrendingUp, Clock } from 'lucide-react'
import { format } from 'date-fns'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/admin/analytics')
      if (!res.ok) throw new Error('Failed to fetch analytics')
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

  // Prepare time-series data (last 30 days)
  const timeSeriesData = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    timeSeriesData.push({
      date: format(date, 'MMM dd'),
      attempts: 0, // Would need to query by date in real implementation
      avgScore: 0,
    })
  }

  // Quiz performance data for bar chart
  const quizPerformanceData = (data?.quizStats || [])
    .sort((a: any, b: any) => b.attempts - a.attempts)
    .slice(0, 10)
    .map((quiz: any) => ({
      name: quiz.title.length > 20 ? quiz.title.substring(0, 20) + '...' : quiz.title,
      attempts: quiz.attempts,
      avgScore: quiz.averageScore,
    }))

  // Score distribution
  const scoreRanges = [
    { name: '0-20%', count: 0 },
    { name: '21-40%', count: 0 },
    { name: '41-60%', count: 0 },
    { name: '61-80%', count: 0 },
    { name: '81-100%', count: 0 },
  ]

  // Completion status pie chart data
  const completionData = [
    { name: 'Completed', value: data?.completionRate || 0 },
    { name: 'Pending', value: 100 - (data?.completionRate || 0) },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive insights into quiz performance and user engagement
        </p>
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

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Quiz Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={quizPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="attempts" fill="#0088FE" name="Attempts" />
                <Bar dataKey="avgScore" fill="#00C49F" name="Avg Score %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Completion Status */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={completionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {completionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.recentAttempts && data.recentAttempts.length > 0 ? (
              data.recentAttempts.map((attempt: any) => (
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
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No recent activity
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quiz Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Quiz Title</th>
                  <th className="text-right p-2">Attempts</th>
                  <th className="text-right p-2">Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {data?.quizStats && data.quizStats.length > 0 ? (
                  data.quizStats
                    .sort((a: any, b: any) => b.attempts - a.attempts)
                    .map((quiz: any) => (
                      <tr key={quiz.id} className="border-b">
                        <td className="p-2">{quiz.title}</td>
                        <td className="text-right p-2">{quiz.attempts}</td>
                        <td className="text-right p-2">
                          {quiz.averageScore.toFixed(1)}%
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={3} className="text-center text-muted-foreground p-8">
                      No quiz data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
