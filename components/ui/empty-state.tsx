import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  children?: ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  children,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        {Icon && (
          <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        )}
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && (
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            {description}
          </p>
        )}
        {action && (
          <Button onClick={action.onClick}>{action.label}</Button>
        )}
        {children}
      </CardContent>
    </Card>
  )
}

