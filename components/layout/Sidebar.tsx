'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  BookOpen, 
  ClipboardList, 
  Trophy, 
  Users, 
  BarChart3,
  FileQuestion
} from 'lucide-react'

const guestNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/quizzes', label: 'Quizzes', icon: BookOpen },
  { href: '/dashboard/assignments', label: 'My Assignments', icon: ClipboardList },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
]

const adminNavItems = [
  { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/admin/quizzes', label: 'Quizzes', icon: FileQuestion },
  { href: '/dashboard/admin/assignments', label: 'Assignments', icon: ClipboardList },
  { href: '/dashboard/admin/users', label: 'Users', icon: Users },
  { href: '/dashboard/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()

  const navItems = user?.role === 'admin' ? adminNavItems : guestNavItems

  return (
    <aside className="w-64 border-r bg-card">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

