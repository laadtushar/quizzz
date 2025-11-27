'use client'

import { useQuery } from '@tanstack/react-query'
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
import Link from 'next/link'
import { Plus, FileQuestion, Search, Loader2 } from 'lucide-react'

export default function AdminQuizzesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')

  const { data, isLoading } = useQuery({
    queryKey: ['quizzes', 'admin'],
    queryFn: async () => {
      const res = await fetch('/api/quizzes')
      if (!res.ok) throw new Error('Failed to fetch quizzes')
      return res.json()
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
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

      {/* Quiz Grid */}
      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all' || visibilityFilter !== 'all'
                ? 'No quizzes match your filters.'
                : 'No quizzes yet. Create your first quiz!'}
            </p>
            {(!searchQuery && statusFilter === 'all' && visibilityFilter === 'all') && (
              <Link href="/dashboard/admin/quizzes/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Quiz
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz: any) => (
            <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileQuestion className="h-5 w-5" />
                  {quiz.title}
                </CardTitle>
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
      )}
    </div>
  )
}
