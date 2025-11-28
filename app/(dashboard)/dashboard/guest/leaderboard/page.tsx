'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trophy, Medal, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LeaderboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard')
      if (!res.ok) throw new Error('Failed to fetch leaderboard')
      return res.json()
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  const leaderboard = data?.leaderboard || []
  const currentUserId = data?.currentUserId

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />
    if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Leaderboard</h1>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {leaderboard.map((user: any) => {
              const initials = user.displayName
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)

              const isCurrentUser = user.id === currentUserId

              return (
                <div
                  key={user.id}
                  className={cn(
                    'flex items-center gap-4 p-4',
                    isCurrentUser && 'bg-primary/5'
                  )}
                >
                  <div className="w-12 flex items-center justify-center">
                    {getRankIcon(user.rank)}
                  </div>
                  <Avatar>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{user.displayName}</span>
                      {isCurrentUser && (
                        <span className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.quizzesCompleted} quizzes completed
                      {user.averagePercentage > 0 && (
                        <span className="ml-2">• Avg: {user.averagePercentage.toFixed(1)}%</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-lg font-bold text-primary">
                      {user.totalXp.toLocaleString()} XP
                    </div>
                    {user.totalScore > 0 && (
                      <div className="text-sm font-medium text-muted-foreground">
                        {user.totalScore.toLocaleString()} pts
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {leaderboard.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No users on the leaderboard yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

