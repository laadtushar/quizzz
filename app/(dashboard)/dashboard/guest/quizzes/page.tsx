'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { BookOpen, Search, Clock, Trophy, CheckCircle2, UserPlus } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function GuestQuizzesPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [filterCompletion, setFilterCompletion] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('newest')

  // Fetch assignments to check which quizzes are already assigned
  const { data: assignmentsData } = useQuery({
    queryKey: ['assignments', 'my'],
    queryFn: async () => {
      const res = await fetch('/api/assignments/my')
      if (!res.ok) return { assignments: [] }
      return res.json()
    },
  })

  const assignedQuizIds = new Set(
    assignmentsData?.assignments?.map((a: any) => a.quiz.id) || []
  )

  const { data, isLoading, error } = useQuery({
    queryKey: ['quizzes', 'visible', searchTerm, filterDifficulty, filterCompletion, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterDifficulty !== 'all') params.append('difficulty', filterDifficulty)
      if (filterCompletion !== 'all') params.append('completionStatus', filterCompletion)
      if (sortBy) params.append('sortBy', sortBy)

      const res = await fetch(`/api/quizzes/visible?${params.toString()}`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch quizzes: ${res.status}`)
      }
      const result = await res.json()
      console.log('Fetched quizzes:', result)
      return result
    },
  })

  const selfAssignMutation = useMutation({
    mutationFn: async (quizId: string) => {
      const res = await fetch('/api/assignments/self', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to assign quiz')
      }
      return res.json()
    },
    onSuccess: () => {
      // Invalidate both queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['assignments', 'my'] })
      queryClient.invalidateQueries({ queryKey: ['quizzes', 'visible'] })
      toast({
        title: 'Success',
        description: 'Quiz assigned to you successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Available Quizzes</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">
              Error loading quizzes: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const quizzes = data?.quizzes || []
  
  console.log('Quizzes to display:', quizzes.length, quizzes)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Available Quizzes</h1>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-grow min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quizzes..."
            className="pl-9 pr-4"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterCompletion} onValueChange={setFilterCompletion}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Quizzes</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="not-completed">Not Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="title">Title (A-Z)</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz: any) => (
          <Card key={quiz.id} className="relative">
            {quiz.isCompleted && (
              <div className="absolute top-4 right-4">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            )}
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {quiz.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {quiz.description || 'No description'}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {quiz._count?.questions || 0} questions
                  </span>
                  <Badge variant="outline" className="capitalize">
                    {quiz.settingsDifficultyLevel}
                  </Badge>
                </div>

                {quiz.estimatedTime && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {quiz.estimatedTime} min
                  </div>
                )}

                {quiz.averageScore !== null && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Trophy className="h-3 w-3" />
                    Avg Score: {Number(quiz.averageScore).toFixed(1)}%
                  </div>
                )}

                {quiz.isCompleted && quiz.userBestScore !== null && (
                  <div className="text-sm font-medium text-green-600">
                    Your Best: {Number(quiz.userBestScore).toFixed(1)}%
                  </div>
                )}

                {quiz.tags && quiz.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {quiz.tags.slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {!assignedQuizIds.has(quiz.id) ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selfAssignMutation.mutate(quiz.id)}
                    disabled={selfAssignMutation.isPending}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    {selfAssignMutation.isPending ? 'Assigning...' : 'Assign to Me'}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Assigned
                  </Button>
                )}
                <Link href={`/dashboard/guest/quizzes/${quiz.id}/take`} className="flex-1">
                  <Button className="w-full" variant={quiz.isCompleted ? 'outline' : 'default'}>
                    {quiz.isCompleted ? 'Retake Quiz' : 'Start Quiz'}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {quizzes.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No quizzes found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
