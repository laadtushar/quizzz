'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { useAuth } from '@/components/providers/AuthProvider'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Mail, AlertCircle } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const { login } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit: SubmitHandler<LoginInput> = async (data) => {
    setIsLoading(true)
    setUnverifiedEmail(null)
    try {
      await login(data.email, data.password)
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      })
      router.push('/dashboard')
    } catch (error: any) {
      // Check if error is due to unverified email
      if (error?.code === 'EMAIL_NOT_VERIFIED' || error?.message?.includes('Email not verified')) {
        setUnverifiedEmail(data.email)
        toast({
          title: 'Email Not Verified',
          description: 'Please verify your email before logging in. Check your inbox for the verification link.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Login failed',
          variant: 'destructive',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!unverifiedEmail) return

    setIsResending(true)
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: unverifiedEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message || 'Verification email sent. Please check your inbox.',
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to resend verification email',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resend verification email',
        variant: 'destructive',
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@alsoit.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message as string}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message as string}</p>
            )}
          </div>

          {unverifiedEmail && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Email Not Verified</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-3">
                  Please verify your email address before logging in. Check your inbox for the verification link.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {isResending ? 'Sending...' : 'Resend Verification Email'}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

