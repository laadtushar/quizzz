'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { Plus, FileQuestion, Search, Loader2, Trash2 } from 'lucide-react'

export default function AdminQuizzesPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [selectedQuizIds, setSelectedQuizIds] = useState<Set<string>>(new Set())
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['quizzes', 'admin'],
    queryFn: async () => {
      const res = await fetch('/api/quizzes')
      if (!res.ok) throw new Error('Failed to fetch quizzes')
      return res.json()
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (quizIds: string[]) => {
      const res = await fetch('/api/quizzes/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizIds }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete quizzes')
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast({
        title: 'Quizzes deleted',
        description: `Successfully deleted ${data.deletedCount} quiz(es).`,
      })
      setSelectedQuizIds(new Set())
      queryClient.invalidateQueries({ queryKey: ['quizzes'] })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const quizzes = useMemo(() => {
    if (!data?.quizzes) return []

    let filtered = [...data.quizzes]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (quiz: any) =>
          quiz.title.toLowerCase().includes(query) ||
          quiz.description?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((quiz: any) => quiz.status === statusFilter)
    }

    // Visibility filter
    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(
        (quiz: any) => quiz.visibility === visibilityFilter
      )
    }

    // Sort
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'newest':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        case 'oldest':
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        case 'title':
          return a.title.localeCompare(b.title)
        case 'questions':
          return (b._count?.questions || 0) - (a._count?.questions || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [data?.quizzes, searchQuery, statusFilter, visibilityFilter, sortBy])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuizIds(new Set(quizzes.map((q: any) => q.id)))
    } else {
      setSelectedQuizIds(new Set())
    }
  }

  const handleSelectQuiz = (quizId: string, checked: boolean) => {
    const newSelected = new Set(selectedQuizIds)
    if (checked) {
      newSelected.add(quizId)
    } else {
      newSelected.delete(quizId)
    }
    setSelectedQuizIds(newSelected)
  }

  const handleBulkDelete = () => {
    if (selectedQuizIds.size === 0) return
    bulkDeleteMutation.mutate(Array.from(selectedQuizIds))
    setIsBulkDeleteDialogOpen(false)
  }

  const allSelected = quizzes.length > 0 && selectedQuizIds.size === quizzes.length
  const someSelected = selectedQuizIds.size > 0 && selectedQuizIds.size < quizzes.length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
            <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visibility</SelectItem>
                <SelectItem value="visible">Visible</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
                <SelectItem value="questions">Most Questions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedQuizIds.size > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedQuizIds.size} quiz(es) selected
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsBulkDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz Grid */}
      {quizzes.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title={
            searchQuery || statusFilter !== 'all' || visibilityFilter !== 'all'
              ? 'No quizzes match your filters'
              : 'No quizzes yet'
          }
          description={
            searchQuery || statusFilter !== 'all' || visibilityFilter !== 'all'
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Create your first quiz to get started!'
          }
          action={
            !searchQuery && statusFilter === 'all' && visibilityFilter === 'all'
              ? {
                  label: 'Create Quiz',
                  onClick: () => {
                    window.location.href = '/dashboard/admin/quizzes/create'
                  },
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              Select all ({quizzes.length})
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz: any) => (
              <Card
                key={quiz.id}
                className={`hover:shadow-lg transition-shadow ${
                  selectedQuizIds.has(quiz.id) ? 'ring-2 ring-primary' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={selectedQuizIds.has(quiz.id)}
                      onCheckedChange={(checked) =>
                        handleSelectQuiz(quiz.id, checked as boolean)
                      }
                      className="mt-1"
                    />
                    <CardTitle className="flex items-center gap-2 flex-1">
                      <FileQuestion className="h-5 w-5" />
                      {quiz.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {quiz.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-muted-foreground">
                      {quiz._count?.questions || 0} questions
                    </span>
                    <div className="flex gap-2">
                      <Badge
                        variant={
                          quiz.status === 'published' ? 'default' : 'secondary'
                        }
                      >
                        {quiz.status}
                      </Badge>
                      {quiz.visibility === 'hidden' && (
                        <Badge variant="outline">Hidden</Badge>
                      )}
                    </div>
                  </div>
                  <Link href={`/dashboard/admin/quizzes/${quiz.id}`}>
                    <Button variant="outline" className="w-full">
                      Edit Quiz
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <AlertDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Quizzes?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{' '}
              {selectedQuizIds.size} quiz(es) and all their questions. Any
              attempts or assignments related to these quizzes will also be
              affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
