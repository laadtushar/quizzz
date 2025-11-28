'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  const queryClient = useQueryClient()
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
    reset,
    trigger,
  } = useForm<AssignmentForm>({
    resolver: zodResolver(createAssignmentSchema),
    defaultValues: {
      quizId: '',
      userIds: [],
      dueDate: null,
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: AssignmentForm) => {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
      reset({
        quizId: '',
        userIds: [],
        dueDate: null,
      })
      // Invalidate assignments query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
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
    // Convert datetime-local format to ISO string
    let dueDate: string | null = data.dueDate || null
    
    // Handle empty string
    if (dueDate === '' || (typeof dueDate === 'string' && dueDate.trim() === '')) {
      dueDate = null
    } else if (dueDate && typeof dueDate === 'string') {
      try {
        // datetime-local returns "YYYY-MM-DDTHH:mm", convert to ISO
        if (dueDate.includes('T') && !dueDate.includes('Z') && !dueDate.includes('+')) {
          // Parse the datetime-local string and convert to ISO
          const date = new Date(dueDate)
          if (isNaN(date.getTime())) {
            toast({
              title: 'Error',
              description: 'Invalid date format. Please use the date picker.',
              variant: 'destructive',
            })
            return
          }
          dueDate = date.toISOString()
        } else if (!dueDate.includes('Z') && !dueDate.includes('+')) {
          // Try to parse as date and convert to ISO
          const date = new Date(dueDate)
          if (isNaN(date.getTime())) {
            toast({
              title: 'Error',
              description: 'Invalid date format. Please use the date picker.',
              variant: 'destructive',
            })
            return
          }
          dueDate = date.toISOString()
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Invalid date format. Please use the date picker.',
          variant: 'destructive',
        })
        return
      }
    }
    
    // Submit with converted dueDate
    createMutation.mutate({ ...data, dueDate })
  }
  
  const onError = (errors: any) => {
    console.log('Form validation errors:', errors)
    // Only show toast if there are actual validation errors
    if (Object.keys(errors).length > 0) {
      toast({
        title: 'Validation Error',
        description: 'Please check the form and fix any errors.',
        variant: 'destructive',
      })
    }
  }

  // Sync selectedUserIds with form state (always keep in sync for validation)
  useEffect(() => {
    setValue('userIds', selectedUserIds, { shouldValidate: false, shouldDirty: true, shouldTouch: false })
  }, [selectedUserIds, setValue])

  const toggleUser = (userId: string) => {
    const newUserIds = selectedUserIds.includes(userId)
      ? selectedUserIds.filter((id) => id !== userId)
      : [...selectedUserIds, userId]
    
    setSelectedUserIds(newUserIds)
  }

  const quizzes = quizzesData?.quizzes || []
  const users = usersData?.users?.filter((u: any) => u.role === 'guest') || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Assignment</CardTitle>
      </CardHeader>
      <CardContent>
        <form 
          onSubmit={handleSubmit(
            (data) => {
              // Use selectedUserIds from state (most up-to-date)
              const finalData = { ...data, userIds: selectedUserIds }
              onSubmit(finalData)
            },
            (errors) => {
              // Only show error if there are actual validation errors
              if (errors && Object.keys(errors).length > 0) {
                console.log('Form validation errors:', errors)
                onError(errors)
              }
            }
          )} 
          className="space-y-6"
        >
          <div className="space-y-2">
            <Label htmlFor="quizId">Quiz *</Label>
            <Select
              onValueChange={(value) => {
                console.log('Quiz selected:', value)
                setValue('quizId', value, { shouldValidate: true })
              }}
              value={watch('quizId') || ''}
            >
              <SelectTrigger id="quizId">
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
            {!watch('quizId') && (
              <p className="text-sm text-muted-foreground">Please select a quiz</p>
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
            {errors.userIds && (
              <p className="text-sm text-destructive">{errors.userIds.message as string}</p>
            )}
            {selectedUserIds.length === 0 && !errors.userIds && (
              <p className="text-sm text-muted-foreground">Select at least one user</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (Optional)</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              {...register('dueDate', {
                setValueAs: (value) => {
                  if (!value || value === '') return null
                  return value
                },
              })}
            />
            {errors.dueDate && (
              <p className="text-sm text-destructive">
                {errors.dueDate.message as string || 'Invalid datetime format'}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createMutation.isPending || selectedUserIds.length === 0 || !watch('quizId')}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Assignment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

