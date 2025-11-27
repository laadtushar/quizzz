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
    reset,
  } = useForm<AssignmentForm>({
    resolver: zodResolver(createAssignmentSchema),
    defaultValues: {
      quizId: '',
      dueDate: null,
    },
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
      reset({
        quizId: '',
        dueDate: null,
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

  const onSubmit = (data: AssignmentForm) => {
    console.log('Form submitted with data:', data)
    console.log('Selected user IDs:', selectedUserIds)
    
    if (!data.quizId) {
      toast({
        title: 'Error',
        description: 'Please select a quiz',
        variant: 'destructive',
      })
      return
    }
    
    if (selectedUserIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one user',
        variant: 'destructive',
      })
      return
    }
    
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
    
    console.log('Submitting assignment with:', { ...data, dueDate, userIds: selectedUserIds })
    createMutation.mutate({ ...data, dueDate, userIds: selectedUserIds })
  }
  
  const onError = (errors: any) => {
    console.log('Form validation errors:', errors)
    toast({
      title: 'Validation Error',
      description: 'Please check the form and fix any errors.',
      variant: 'destructive',
    })
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
        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
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
            {selectedUserIds.length === 0 && (
              <p className="text-sm text-destructive">Select at least one user</p>
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
            onClick={(e) => {
              console.log('Button clicked')
              console.log('Quiz ID:', watch('quizId'))
              console.log('Selected users:', selectedUserIds)
              console.log('Form errors:', errors)
              if (!watch('quizId')) {
                e.preventDefault()
                toast({
                  title: 'Error',
                  description: 'Please select a quiz',
                  variant: 'destructive',
                })
              } else if (selectedUserIds.length === 0) {
                e.preventDefault()
                toast({
                  title: 'Error',
                  description: 'Please select at least one user',
                  variant: 'destructive',
                })
              }
            }}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Assignment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

