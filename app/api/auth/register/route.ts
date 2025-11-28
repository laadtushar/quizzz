import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password'
import { hasAlsoitEmail } from '@/lib/auth/middleware'
import { registerSchema } from '@/lib/validations/auth'
import { generateVerificationToken, getVerificationExpiry } from '@/lib/auth/email-verification'
import { sendEmailVerification } from '@/lib/email/sender'

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

    // Generate email verification token
    const verificationToken = generateVerificationToken()
    const verificationExpiry = getVerificationExpiry()

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email.toLowerCase(),
        passwordHash,
        displayName: validatedData.displayName,
        role,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
      },
    })

    // Send verification email (non-blocking - user is created even if email fails)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const verificationLink = `${appUrl}/api/auth/verify-email?token=${verificationToken}`
    
    // Don't await - send email in background, don't block user registration
    sendEmailVerification({
      email: user.email,
      displayName: user.displayName,
      verificationLink,
    }).catch((error) => {
      console.error('Failed to send verification email (non-critical):', error)
    })

    // Don't create session - user must verify email before logging in
    // Return message indicating verification email was sent
    return NextResponse.json({
      message: 'Registration successful. Please check your email to verify your account before logging in.',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        emailVerified: false,
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

