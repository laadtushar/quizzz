import { NextRequest } from 'next/server'

/**
 * Get the application URL from the request or environment variable
 * Falls back to localhost for development
 */
export function getAppUrl(request?: NextRequest): string {
  // Try to get from request headers first (most reliable)
  if (request) {
    const host = request.headers.get('host')
    const protocol = request.headers.get('x-forwarded-proto') || 
                     (request.headers.get('x-forwarded-ssl') === 'on' ? 'https' : 'http')
    
    if (host) {
      return `${protocol}://${host}`
    }
  }

  // Fall back to environment variable
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // Last resort: localhost for development
  return 'http://localhost:3000'
}

