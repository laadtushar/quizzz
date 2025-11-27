'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/components/providers/AuthProvider'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'

export default function UsersPage() {
  const { toast } = useToast()
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'guest' }) => {
      setUpdatingUserId(userId)
      const res = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update role')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast({
        title: 'Success',
        description: 'User role updated successfully',
      })
      setUpdatingUserId(null)
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
      setUpdatingUserId(null)
    },
  })

  const handleRoleChange = (userId: string, newRole: 'admin' | 'guest') => {
    updateRoleMutation.mutate({ userId, role: newRole })
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  const users = data?.users || []

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Users</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user: any) => {
          const initials = user.displayName
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)

          return (
            <Card key={user.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{user.displayName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">XP:</span> {user.totalXp.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Quizzes Completed:</span>{' '}
                      {user.quizzesCompleted}
                    </div>
                    <div>
                      <span className="font-medium">Joined:</span>{' '}
                      {format(new Date(user.createdAt), 'PP')}
                    </div>
                    {user.lastLoginAt && (
                      <div>
                        <span className="font-medium">Last Login:</span>{' '}
                        {format(new Date(user.lastLoginAt), 'PPp')}
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-2 border-t">
                    <label className="text-sm font-medium mb-2 block">Role</label>
                    <Select
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value as 'admin' | 'guest')}
                      disabled={updatingUserId === user.id || currentUser?.id === user.id}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="guest">Guest</SelectItem>
                      </SelectContent>
                    </Select>
                    {updatingUserId === user.id && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Updating...
                      </div>
                    )}
                    {currentUser?.id === user.id && (
                      <p className="text-xs text-muted-foreground mt-1">
                        You cannot change your own role
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {users.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No users found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
