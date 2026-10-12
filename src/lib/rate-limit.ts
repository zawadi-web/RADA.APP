/**
 * Cyber Security & Anti-Abuse Rate Limiter for Rada
 * Implements an in-memory sliding window counter to protect against
 * brute force attacks, credential stuffing, DDoS, and OTP spam.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired keys every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  retryAfterSec: number;
}

/**
 * Checks whether an action by a given identifier (e.g. IP or email) is within rate limits.
 *
 * @param identifier Unique key (e.g. "login:192.168.1.1" or "forgot:user@email.com")
 * @param limit Max requests allowed in the window
 * @param windowMs Window duration in milliseconds (e.g. 15 * 60 * 1000 for 15 mins)
 */
export function rateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetAt) {
    // New or expired window
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      retryAfterSec: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= limit) {
    // Rate limit exceeded
    const retryAfterSec = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      success: false,
      limit,
      remaining: 0,
      retryAfterSec,
    };
  }

  // Increment within window
  record.count += 1;
  const remaining = Math.max(0, limit - record.count);
  const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);

  return {
    success: true,
    limit,
    remaining,
    retryAfterSec,
  };
}

/**
 * Extracts client IP from Next.js request headers.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
