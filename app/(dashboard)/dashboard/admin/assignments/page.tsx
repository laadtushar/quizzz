'use client'

import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { AssignmentCreator } from '@/components/admin/AssignmentCreator'
import { BulkAssignmentImporter } from '@/components/admin/BulkAssignmentImporter'
import { format } from 'date-fns'
import Link from 'next/link'
import { FileText, Download } from 'lucide-react'
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AdminAssignmentsPage() {
  const [isExporting, setIsExporting] = useState(false)
  const { data, isLoading } = useQuery({
    queryKey: ['assignments', 'admin'],
    queryFn: async () => {
      const res = await fetch('/api/assignments')
      if (!res.ok) throw new Error('Failed to fetch assignments')
      return res.json()
    },
  })

  const assignments = data?.assignments || []

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const res = await fetch('/api/assignments/export')
      if (!res.ok) throw new Error('Failed to export')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `assignments-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="h-7 w-32" />
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div>
            <Skeleton className="h-7 w-40 mb-4" />
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Assignments</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={isExporting || assignments.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Link href="/dashboard/admin/assignments/create">
            <Button>Create Assignment</Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">All Assignments</TabsTrigger>
          <TabsTrigger value="create">Create Assignment</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
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
            {assignments.length === 0 && (
              <EmptyState
                icon={FileText}
                title="No assignments yet"
                description="Create your first assignment to get started."
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="create">
          <AssignmentCreator />
        </TabsContent>

        <TabsContent value="bulk">
          <BulkAssignmentImporter
            onSuccess={() => {
              // Refresh assignments list
              window.location.reload()
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
