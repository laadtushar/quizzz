'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface QuizProgressBarProps {
  current: number
  total: number
  className?: string
}

export function QuizProgressBar({ current, total, className }: QuizProgressBarProps) {
  const percentage = (current / total) * 100

  return (
    <Card className={cn('p-4', className)}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm text-muted-foreground">
            {current} of {total}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </Card>
  )
}


