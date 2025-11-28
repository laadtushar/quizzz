// Simple in-memory rate limiter
// For production, consider using Redis or a dedicated service

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export function rateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const key = identifier

  let entry = rateLimitStore.get(key)

  // Clean up expired entries
  if (entry && entry.resetAt < now) {
    rateLimitStore.delete(key)
    entry = undefined
  }

  if (!entry) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
    }
    rateLimitStore.set(key, entry)
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: entry.resetAt,
    }
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  entry.count++
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute


