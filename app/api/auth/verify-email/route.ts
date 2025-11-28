import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isTokenExpired } from '@/lib/auth/email-verification'
import { getAppUrl } from '@/lib/utils/app-url'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      const appUrl = getAppUrl(request)
      return NextResponse.redirect(`${appUrl}/auth/verify-email?error=missing_token`)
    }

    // Find user by verification token
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
    })

    const appUrl = getAppUrl(request)

    if (!user) {
      return NextResponse.redirect(`${appUrl}/auth/verify-email?error=invalid_token`)
    }

    // Check if token is expired
    if (isTokenExpired((user as any).emailVerificationExpiry)) {
      return NextResponse.redirect(`${appUrl}/auth/verify-email?error=expired_token`)
    }

    // Check if already verified
    if ((user as any).emailVerified === true) {
      return NextResponse.redirect(`${appUrl}/auth/verify-email?error=already_verified`)
    }

    // Verify email
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true as any,
        emailVerificationToken: null as any,
        emailVerificationExpiry: null as any,
      },
    })

    // Redirect to success page
    return NextResponse.redirect(`${appUrl}/auth/verify-email?success=true`)
  } catch (error) {
    console.error('Email verification error:', error)
    const appUrl = getAppUrl(request)
    return NextResponse.redirect(`${appUrl}/auth/verify-email?error=server_error`)
  }
}

