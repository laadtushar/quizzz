import { NextRequest, NextResponse } from 'next/server'
import { getSessionToken, getSession } from './session'

export interface AuthUser {
  id: string
  email: string
  displayName: string
  role: 'admin' | 'guest'
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getSessionToken()
  if (!token) {
    return null
  }

  const session = await getSession(token)
  if (!session) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
    role: session.user.role,
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth()
  if (user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required')
  }
  return user
}

export function hasAlsoitEmail(email: string): boolean {
  const allowedDomain = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || '@alsoit.com'
  return email.toLowerCase().endsWith(allowedDomain.toLowerCase())
}

export function isOwner(userId: string, resourceUserId: string): boolean {
  return userId === resourceUserId
}

export function isAdmin(role: string): boolean {
  return role === 'admin'
}

export function isAuthenticated(user: AuthUser | null): boolean {
  return user !== null
}

