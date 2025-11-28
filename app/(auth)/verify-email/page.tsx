'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const error = searchParams.get('error')
    const success = searchParams.get('success')

    if (success === 'true') {
      setStatus('success')
      setMessage('Your email has been verified successfully!')
    } else if (error) {
      setStatus('error')
      switch (error) {
        case 'missing_token':
          setMessage('Verification token is missing.')
          break
        case 'invalid_token':
          setMessage('Invalid verification token.')
          break
        case 'expired_token':
          setMessage('Verification token has expired. Please request a new one.')
          break
        case 'already_verified':
          setMessage('This email has already been verified.')
          break
        default:
          setMessage('An error occurred during verification.')
      }
    } else {
      setStatus('loading')
      setMessage('Verifying your email...')
    }
  }, [searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>Verify your email address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-center text-lg font-semibold">{message}</p>
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-center text-muted-foreground">{message}</p>
              <div className="flex gap-2">
                <Link href="/auth/login">
                  <Button variant="outline">Go to Login</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Register Again</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Email Verification</CardTitle>
              <CardDescription>Verify your email address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-center text-muted-foreground">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}

