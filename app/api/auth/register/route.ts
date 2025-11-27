import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password'
import { createSession, setSessionCookie } from '@/lib/auth/session'
import { hasAlsoitEmail } from '@/lib/auth/middleware'
import { registerSchema } from '@/lib/validations/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Check email domain
    if (!hasAlsoitEmail(validatedData.email)) {
      return NextResponse.json(
        { error: 'Email must be from @alsoit.com domain' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Determine role: first user is admin, others are guests
    const userCount = await prisma.user.count()
    const role = userCount === 0 ? 'admin' : 'guest'

    // Hash password
    const passwordHash = await hashPassword(validatedData.password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email.toLowerCase(),
        passwordHash,
        displayName: validatedData.displayName,
        role,
      },
    })

    // Create session
    const token = await createSession(user.id)
    setSessionCookie(token)

    // Return sanitized user
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

