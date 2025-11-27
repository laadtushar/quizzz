'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { createAssignmentSchema } from '@/lib/validations/assignment'
import type { z } from 'zod'

type AssignmentForm = z.infer<typeof createAssignmentSchema>

export function AssignmentCreator() {
  const { toast } = useToast()
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])

  // Fetch quizzes
  const { data: quizzesData } = useQuery({
    queryKey: ['quizzes', 'published'],
    queryFn: async () => {
      const res = await fetch('/api/quizzes?status=published')
      if (!res.ok) throw new Error('Failed to fetch quizzes')
      return res.json()
    },
  })

  // Fetch users
  const { data: usersData } = useQuery({
    queryKey: ['users', 'guests'],
    queryFn: async () => {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AssignmentForm>({
    resolver: zodResolver(createAssignmentSchema),
  })

  const createMutation = useMutation({
    mutationFn: async (data: AssignmentForm) => {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, userIds: selectedUserIds }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create assignment')
      }
      return res.json()
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Assignment created successfully',
      })
      setSelectedUserIds([])
      setValue('quizId', '')
      setValue('dueDate', undefined)
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: AssignmentForm) => {
    if (selectedUserIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one user',
        variant: 'destructive',
      })
      return
    }
    createMutation.mutate({ ...data, userIds: selectedUserIds })
  }

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    )
  }

  const quizzes = quizzesData?.quizzes || []
  const users = usersData?.users?.filter((u: any) => u.role === 'guest') || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Assignment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="quizId">Quiz *</Label>
            <Select
              onValueChange={(value) => setValue('quizId', value)}
              value={watch('quizId')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a quiz" />
              </SelectTrigger>
              <SelectContent>
                {quizzes.map((quiz: any) => (
                  <SelectItem key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.quizId && (
              <p className="text-sm text-destructive">{errors.quizId.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Assign To *</Label>
            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users available</p>
              ) : (
                <div className="space-y-2">
                  {users.map((user: any) => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={user.id}
                        checked={selectedUserIds.includes(user.id)}
                        onCheckedChange={() => toggleUser(user.id)}
                      />
                      <Label
                        htmlFor={user.id}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {user.displayName} ({user.email})
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedUserIds.length === 0 && (
              <p className="text-sm text-destructive">Select at least one user</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (Optional)</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              {...register('dueDate')}
            />
            {errors.dueDate && (
              <p className="text-sm text-destructive">{errors.dueDate.message as string}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createMutation.isPending || selectedUserIds.length === 0}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Assignment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

