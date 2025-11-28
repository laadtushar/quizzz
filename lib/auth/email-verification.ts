import crypto from 'crypto'

/**
 * Generate a secure random token for email verification
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Generate expiry date for verification token (24 hours from now)
 */
export function getVerificationExpiry(): Date {
  const expiry = new Date()
  expiry.setHours(expiry.getHours() + 24)
  return expiry
}

/**
 * Check if verification token is expired
 */
export function isTokenExpired(expiry: Date | null): boolean {
  if (!expiry) return true
  return new Date() > expiry
}

