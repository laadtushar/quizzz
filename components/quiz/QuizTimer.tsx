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
  const [showWarning, setShowWarning] = useState(false)
  const [showUrgentWarning, setShowUrgentWarning] = useState(false)

  useEffect(() => {
    if (secondsRemaining <= 0) {
      setIsExpired(true)
      onExpire?.()
      return
    }

    // Show warning at 2 minutes (120 seconds)
    if (secondsRemaining <= 120 && secondsRemaining > 30) {
      setShowWarning(true)
      setShowUrgentWarning(false)
    } else if (secondsRemaining <= 30) {
      // Show urgent warning at 30 seconds
      setShowWarning(false)
      setShowUrgentWarning(true)
    } else {
      setShowWarning(false)
      setShowUrgentWarning(false)
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

  const isWarning = showWarning || showUrgentWarning
  const isCritical = showUrgentWarning

  return (
    <Card className={cn('p-4', className, isCritical && 'border-red-500', isWarning && !isCritical && 'border-yellow-500')}>
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
              isCritical && 'text-red-600 animate-pulse',
              isWarning && !isCritical && 'text-yellow-600'
            )}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
          {showUrgentWarning && (
            <p className="text-xs text-red-600 font-medium mb-1">
              ⚠️ Less than 30 seconds remaining!
            </p>
          )}
          {showWarning && !showUrgentWarning && (
            <p className="text-xs text-yellow-600 font-medium mb-1">
              ⚠️ Less than 2 minutes remaining
            </p>
          )}
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

