'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuizSettingsForm } from '@/components/admin/QuizSettingsForm'
import { QuestionList } from '@/components/admin/QuestionList'
import { QuestionEditorDialog } from '@/components/admin/QuestionEditorDialog'
import { QuizPreview } from '@/components/admin/QuizPreview'
import { QuizResultsView } from '@/components/admin/QuizResultsView'
import { BulkQuestionImporter } from '@/components/admin/BulkQuestionImporter'
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
import { useToast } from '@/components/ui/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, Save, Eye, Copy, Trash2, ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'

export default function QuizEditPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const quizId = params.quizId as string

  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const res = await fetch(`/api/quizzes/${quizId}`)
      if (!res.ok) throw new Error('Failed to fetch quiz')
      return res.json()
    },
  })

  const quiz = data?.quiz

  const publishMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/quizzes/${quizId}/publish`, {
        method: 'PATCH',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to publish quiz')
      }
      return res.json()
    },
    onSuccess: () => {
      toast({
        title: 'Quiz published',
        description: 'The quiz is now visible to users.',
      })
      refetch()
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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete quiz')
      }
    },
    onSuccess: () => {
      toast({
        title: 'Quiz deleted',
        description: 'The quiz has been permanently deleted.',
      })
      router.push('/dashboard/admin/quizzes')
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

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/quizzes/${quizId}/duplicate`, {
        method: 'POST',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to duplicate quiz')
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast({
        title: 'Quiz duplicated',
        description: 'A copy of the quiz has been created.',
      })
      router.push(`/dashboard/admin/quizzes/${data.quiz.id}`)
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

  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question)
    setIsQuestionDialogOpen(true)
  }

  const handleAddQuestion = () => {
    setEditingQuestion(null)
    setIsQuestionDialogOpen(true)
  }

  const handleQuestionDialogClose = (open: boolean) => {
    setIsQuestionDialogOpen(open)
    if (!open) {
      setEditingQuestion(null)
    }
  }

  const handlePublish = async () => {
    if (!quiz?.questions || quiz.questions.length === 0) {
      toast({
        title: 'Cannot publish',
        description: 'Please add at least one question before publishing.',
        variant: 'destructive',
      })
      return
    }

    setIsPublishing(true)
    publishMutation.mutate()
    setIsPublishing(false)
  }

  const handleDuplicate = () => {
    setIsDuplicating(true)
    duplicateMutation.mutate()
    setIsDuplicating(false)
  }

  const handleDelete = () => {
    deleteMutation.mutate()
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      const res = await fetch(`/api/quizzes/${quizId}/export-pdf`)
      if (!res.ok) {
        throw new Error('Failed to export PDF')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quiz-report-${quiz?.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast({
        title: 'Success',
        description: 'PDF exported successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to export PDF',
        variant: 'destructive',
      })
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Quiz not found</p>
        <Link href="/dashboard/admin/quizzes">
          <Button variant="outline" className="mt-4">
            Back to Quizzes
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/quizzes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{quiz.title}</h1>
            <p className="text-muted-foreground">
              {quiz.status === 'published' ? 'Published' : 'Draft'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleDuplicate}
            disabled={isDuplicating}
          >
            {isDuplicating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            Duplicate
          </Button>
          {quiz.status === 'draft' && (
            <Button onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              Publish
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="questions">
            Questions ({quiz.questions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardContent className="pt-6">
              <QuizSettingsForm
                quizId={quizId}
                initialData={{
                  title: quiz.title,
                  description: quiz.description,
                  visibility: quiz.visibility,
                  settingsTimerSeconds: quiz.settingsTimerSeconds,
                  settingsAllowRetries: quiz.settingsAllowRetries,
                  settingsMaxAttempts: quiz.settingsMaxAttempts,
                  settingsDifficultyLevel: quiz.settingsDifficultyLevel,
                  settingsPassingScore: quiz.settingsPassingScore
                    ? Number(quiz.settingsPassingScore)
                    : null,
                  tags: quiz.tags || [],
                }}
                onSave={() => {
                  refetch()
                  queryClient.invalidateQueries({ queryKey: ['quiz', quizId] })
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <BulkQuestionImporter
            quizId={quizId}
            onSuccess={() => {
              refetch()
              queryClient.invalidateQueries({ queryKey: ['quiz', quizId] })
            }}
          />
          <QuestionList
            quizId={quizId}
            questions={quiz.questions || []}
            onEdit={handleEditQuestion}
            onRefresh={refetch}
          />
        </TabsContent>

        <TabsContent value="results">
          {quiz.status === 'published' ? (
            <QuizResultsView quizId={quizId} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Publish the quiz to view results. Results will appear here once users complete the quiz.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preview">
          <QuizPreview
            quiz={{
              title: quiz.title,
              description: quiz.description,
              settingsTimerSeconds: quiz.settingsTimerSeconds,
              settingsAllowRetries: quiz.settingsAllowRetries,
              settingsDifficultyLevel: quiz.settingsDifficultyLevel,
              settingsPassingScore: quiz.settingsPassingScore
                ? Number(quiz.settingsPassingScore)
                : null,
            }}
            questions={quiz.questions || []}
          />
        </TabsContent>
      </Tabs>

      <QuestionEditorDialog
        open={isQuestionDialogOpen}
        onOpenChange={handleQuestionDialogClose}
        quizId={quizId}
        question={editingQuestion}
        onSuccess={() => {
          setIsQuestionDialogOpen(false)
          setEditingQuestion(null)
          refetch()
          queryClient.invalidateQueries({ queryKey: ['quiz', quizId] })
        }}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the quiz
              and all its questions. Any attempts or assignments related to this
              quiz will also be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
