'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuizTimerProps {
  totalSeconds: number
  onExpire?: () => void
  className?: string
}

export function QuizTimer({ totalSeconds, onExpire, className }: QuizTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (secondsRemaining <= 0) {
      setIsExpired(true)
      onExpire?.()
      return
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsExpired(true)
          onExpire?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [secondsRemaining, onExpire])

  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const percentage = (secondsRemaining / totalSeconds) * 100

  const isWarning = percentage < 20
  const isCritical = percentage < 10

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center gap-3">
        <Clock className={cn(
          'h-5 w-5',
          isCritical && 'text-red-600',
          isWarning && !isCritical && 'text-yellow-600'
        )} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Time Remaining</span>
            <span className={cn(
              'text-lg font-bold',
              isCritical && 'text-red-600',
              isWarning && !isCritical && 'text-yellow-600'
            )}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all',
                isCritical && 'bg-red-600',
                isWarning && !isCritical && 'bg-yellow-600',
                !isWarning && 'bg-primary'
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}

