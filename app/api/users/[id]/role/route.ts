import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth/middleware'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'guest']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAdmin()

    const body = await request.json()
    const { role } = updateRoleSchema.parse(body)

    // Get the user to update
    const userToUpdate = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!userToUpdate) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent self-demotion
    if (currentUser.id === params.id && role === 'guest') {
      return NextResponse.json(
        { error: 'You cannot demote yourself' },
        { status: 400 }
      )
    }

    // Prevent demoting the last admin
    if (userToUpdate.role === 'admin' && role === 'guest') {
      const adminCount = await prisma.user.count({
        where: { role: 'admin' },
      })

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot demote the last admin. At least one admin must exist.' },
          { status: 400 }
        )
      }
    }

    // Update the user role
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { role },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        totalXp: true,
        quizzesCompleted: true,
        createdAt: true,
        lastLoginAt: true,
        avatarUrl: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      )
    }
    console.error('Update user role error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

