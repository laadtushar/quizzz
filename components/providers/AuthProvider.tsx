'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

interface User {
  id: string
  email: string
  displayName: string
  role: 'admin' | 'guest'
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        return null
      }
      const data = await res.json()
      return data.user as User | null
    },
    retry: false,
  })

  useEffect(() => {
    setUser(data ?? null)
  }, [data])

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const error = await res.json()
      const errorObj = new Error(error.error || 'Login failed') as any
      errorObj.code = error.code
      errorObj.email = error.email
      throw errorObj
    }

    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
  }

  const register = async (email: string, password: string, displayName: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Registration failed')
    }

    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
  }

  const handleRefetch = async () => {
    await refetch()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refetch: handleRefetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


