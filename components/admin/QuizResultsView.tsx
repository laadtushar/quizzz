'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import { Loader2, Download, Trash2, RotateCcw } from 'lucide-react'
import html2canvas from 'html2canvas'
import { useToast } from '@/components/ui/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface QuizResultsViewProps {
  quizId: string
}

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6']

export function QuizResultsView({ quizId }: QuizResultsViewProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isExporting, setIsExporting] = useState(false)
  const [deleteAttemptId, setDeleteAttemptId] = useState<string | null>(null)
  const [resetAttemptId, setResetAttemptId] = useState<string | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['quiz-results', quizId],
    queryFn: async () => {
      const res = await fetch(`/api/quizzes/${quizId}/results`)
      if (!res.ok) throw new Error('Failed to fetch results')
      return res.json()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (attemptId: string) => {
      const res = await fetch(`/api/attempts/${attemptId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete attempt')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-results', quizId] })
      toast({
        title: 'Success',
        description: 'Attempt deleted successfully',
      })
      setDeleteAttemptId(null)
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const resetMutation = useMutation({
    mutationFn: async (attemptId: string) => {
      const res = await fetch(`/api/attempts/${attemptId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to reset attempt')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-results', quizId] })
      toast({
        title: 'Success',
        description: 'Attempt reset successfully. User can now retake the quiz.',
      })
      setResetAttemptId(null)
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleExportPNG = async () => {
    if (!resultsRef.current) return

    setIsExporting(true)
    try {
      // Use html2canvas to capture the entire results section
      const canvas = await html2canvas(resultsRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        windowWidth: resultsRef.current.scrollWidth,
        windowHeight: resultsRef.current.scrollHeight,
      } as any)

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create image')
        }

        // Create download link
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `quiz-results-${data?.quiz?.title?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'quiz'}-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        toast({
          title: 'Export successful',
          description: 'Results exported as PNG',
        })
      }, 'image/png')
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export results',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!data) {
    return <div>No data available</div>
  }

  const { summary, scoreDistribution, responsesOverTime, questionAnalytics } = data

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleExportPNG}
          disabled={isExporting || !data}
          variant="outline"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export as PNG
            </>
          )}
        </Button>
      </div>

      {/* Results Content - This will be exported */}
      <div ref={resultsRef} className="space-y-6 bg-white p-6 rounded-lg">
        {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalAttempts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.averageScore.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.passRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Passed / Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.passedAttempts} / {summary.failedAttempts}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Responses Over Time */}
      {responsesOverTime.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Responses Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={responsesOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Pass/Fail Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Pass vs Fail</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Passed', value: summary.passedAttempts },
                  { name: 'Failed', value: summary.failedAttempts },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#22c55e" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Question-by-Question Analytics */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Question Analysis</h2>
        {questionAnalytics.map((qa: any, index: number) => (
          <Card key={qa.questionId}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    Question {index + 1}: {qa.questionText}
                  </CardTitle>
                  <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                    <span>Type: {qa.questionType}</span>
                    <span>Points: {qa.points}</span>
                    <span>Accuracy: {qa.accuracy.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Correct/Incorrect/Skipped */}
              <div>
                <h3 className="text-sm font-medium mb-2">Response Summary</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { name: 'Correct', count: qa.correctCount, fill: '#22c55e' },
                    { name: 'Incorrect', count: qa.incorrectCount, fill: '#ef4444' },
                    { name: 'Skipped', count: qa.skippedCount, fill: '#94a3b8' },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Answer Distribution */}
              {qa.answerDistribution && qa.answerDistribution.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Answer Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={qa.answerDistribution}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis
                        dataKey="label"
                        type="category"
                        width={150}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          `${value} (${qa.answerDistribution.find((a: any) => a.label === name)?.percentage.toFixed(1)}%)`,
                          'Responses',
                        ]}
                      />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Answer Distribution Table */}
              {qa.answerDistribution && qa.answerDistribution.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Answer Details</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-4 py-2 text-left">Answer</th>
                          <th className="px-4 py-2 text-right">Count</th>
                          <th className="px-4 py-2 text-right">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {qa.answerDistribution.map((dist: any, idx: number) => (
                          <tr key={idx} className="border-t">
                            <td className="px-4 py-2">{dist.label}</td>
                            <td className="px-4 py-2 text-right">{dist.count}</td>
                            <td className="px-4 py-2 text-right">
                              {dist.percentage.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Individual User Responses */}
              {qa.userResponses && qa.userResponses.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Individual Responses</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left">User</th>
                            <th className="px-4 py-2 text-left">Answer</th>
                            <th className="px-4 py-2 text-center">Status</th>
                            <th className="px-4 py-2 text-right">Points</th>
                            <th className="px-4 py-2 text-right">Completed</th>
                            <th className="px-4 py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {qa.userResponses.map((response: any, idx: number) => (
                            <tr key={idx} className="border-t hover:bg-muted/50">
                              <td className="px-4 py-2">
                                <div>
                                  <div className="font-medium">{response.userName}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {response.userEmail}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                <div className="max-w-md truncate" title={response.userAnswer}>
                                  {response.userAnswer}
                                </div>
                              </td>
                              <td className="px-4 py-2 text-center">
                                {response.isCorrect ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    ✓ Correct
                                  </span>
                                ) : response.userAnswer === 'No answer' ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    Skipped
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    ✗ Incorrect
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {response.pointsEarned} / {qa.points}
                              </td>
                              <td className="px-4 py-2 text-right text-xs text-muted-foreground">
                                {response.completedAt
                                  ? new Date(response.completedAt).toLocaleDateString()
                                  : '-'}
                              </td>
                              <td className="px-4 py-2 text-right">
                                {response.attemptId && (
                                  <div className="flex gap-1 justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setResetAttemptId(response.attemptId)}
                                      title="Reset attempt"
                                    >
                                      <RotateCcw className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDeleteAttemptId(response.attemptId)}
                                      title="Delete attempt"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      </div>
      {/* End of exportable content */}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteAttemptId} onOpenChange={(open) => !open && setDeleteAttemptId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attempt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attempt? This action cannot be undone.
              The user&apos;s XP and quiz completion count will be adjusted accordingly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAttemptId && deleteMutation.mutate(deleteAttemptId)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={!!resetAttemptId} onOpenChange={(open) => !open && setResetAttemptId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Attempt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset this attempt? This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Reset the attempt back to &quot;in progress&quot;</li>
                <li>Clear all answers and scores</li>
                <li>Allow the user to retake the quiz</li>
                <li>Adjust the user&apos;s XP and completion count</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resetAttemptId && resetMutation.mutate(resetAttemptId)}
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? 'Resetting...' : 'Reset Attempt'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

