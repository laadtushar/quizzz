import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isTokenExpired } from '@/lib/auth/email-verification'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(
        new URL('/auth/verify-email?error=missing_token', request.url)
      )
    }

    // Find user by verification token
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
    })

    if (!user) {
      return NextResponse.redirect(
        new URL('/auth/verify-email?error=invalid_token', request.url)
      )
    }

    // Check if token is expired
    if (isTokenExpired(user.emailVerificationExpiry)) {
      return NextResponse.redirect(
        new URL('/auth/verify-email?error=expired_token', request.url)
      )
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.redirect(
        new URL('/auth/verify-email?error=already_verified', request.url)
      )
    }

    // Verify email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    })

    // Redirect to success page or dashboard
    return NextResponse.redirect(
      new URL('/auth/verify-email?success=true', request.url)
    )
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(
      new URL('/auth/verify-email?error=server_error', request.url)
    )
  }
}

