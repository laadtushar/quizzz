'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react'
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useToast } from '@/components/ui/use-toast'
import { QuestionType } from '@prisma/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface Question {
  id: string
  orderIndex: number
  type: QuestionType
  questionText: string
  points: number
  options?: Array<{ id: string; text: string; isCorrect: boolean }> | null
  correctAnswer?: any
  explanation?: string | null
}

interface QuestionListProps {
  quizId: string
  questions: Question[]
  onEdit: (question: Question) => void
  onRefresh: () => void
}

function SortableQuestionItem({
  question,
  onEdit,
  onDelete,
}: {
  question: Question
  onEdit: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const typeLabels: Record<QuestionType, string> = {
    mcq: 'MCQ',
    multiple_select: 'Multiple Select',
    true_false: 'True/False',
    ordering: 'Ordering',
    fill_blank: 'Fill Blank',
  }

  const typeColors: Record<QuestionType, string> = {
    mcq: 'bg-blue-100 text-blue-800',
    multiple_select: 'bg-purple-100 text-purple-800',
    true_false: 'bg-green-100 text-green-800',
    ordering: 'bg-orange-100 text-orange-800',
    fill_blank: 'bg-pink-100 text-pink-800',
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing mt-1"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  #{question.orderIndex + 1}
                </span>
                <Badge className={typeColors[question.type]}>
                  {typeLabels[question.type]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {question.points} points
                </span>
              </div>
              <p className="text-sm line-clamp-2">{question.questionText}</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onEdit()
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDelete()
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function QuestionList({
  quizId,
  questions,
  onEdit,
  onRefresh,
}: QuestionListProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const deleteMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const res = await fetch(`/api/quizzes/${quizId}/questions/${questionId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete question')
      }
    },
    onSuccess: () => {
      toast({
        title: 'Question deleted',
        description: 'The question has been removed from the quiz.',
      })
      onRefresh()
      queryClient.invalidateQueries({ queryKey: ['quiz', quizId] })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const reorderMutation = useMutation({
    mutationFn: async (reorderedQuestions: Question[]) => {
      const res = await fetch(`/api/quizzes/${quizId}/questions/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: reorderedQuestions.map((q, index) => ({
            questionId: q.id,
            orderIndex: index,
          })),
        }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to reorder questions')
      }
    },
    onSuccess: () => {
      toast({
        title: 'Questions reordered',
        description: 'The question order has been updated.',
      })
      onRefresh()
      queryClient.invalidateQueries({ queryKey: ['quiz', quizId] })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
      onRefresh() // Refresh to restore original order
    },
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setIsReordering(true)
      const oldIndex = questions.findIndex((q) => q.id === active.id)
      const newIndex = questions.findIndex((q) => q.id === over.id)
      const reorderedQuestions = arrayMove(questions, oldIndex, newIndex)

      // Optimistically update order indices
      const updatedQuestions = reorderedQuestions.map((q, index) => ({
        ...q,
        orderIndex: index,
      }))

      reorderMutation.mutate(updatedQuestions, {
        onSettled: () => setIsReordering(false),
      })
    }
  }

  const handleDelete = () => {
    if (deleteQuestionId) {
      deleteMutation.mutate(deleteQuestionId)
      setDeleteQuestionId(null)
    }
  }

  const sortedQuestions = [...questions].sort((a, b) => a.orderIndex - b.orderIndex)

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Questions</h3>
            <p className="text-sm text-muted-foreground">
              {sortedQuestions.length} question(s)
            </p>
          </div>
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              onEdit(null as any)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>

        {sortedQuestions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No questions yet. Add your first question!
              </p>
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  onEdit(null as any)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedQuestions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {sortedQuestions.map((question) => (
                  <SortableQuestionItem
                    key={question.id}
                    question={question}
                    onEdit={() => onEdit(question)}
                    onDelete={() => setDeleteQuestionId(question.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <AlertDialog
        open={deleteQuestionId !== null}
        onOpenChange={(open) => !open && setDeleteQuestionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              question from the quiz.
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
    </>
  )
}

