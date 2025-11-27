'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/admin/analytics')
      if (!res.ok) throw new Error('Failed to fetch analytics')
      return res.json()
    },
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Analytics</h1>
      <p className="text-muted-foreground">Detailed analytics dashboard</p>
    </div>
  )
}
