interface RateLimitOptions {
  window: number;
  max: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface RateLimitRecord {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries(maxAge: number = 10 * 60 * 1000) {
  const now = Date.now();

  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return;
  }

  lastCleanup = now;

  for (const [key, record] of rateLimitStore.entries()) {
    if (now - record.windowStart > maxAge) {
      rateLimitStore.delete(key);
    }
  }
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const windowMs = options.window * 1000;

  cleanupStaleEntries();

  const existing = rateLimitStore.get(key);

  if (!existing) {
    rateLimitStore.set(key, {
      count: 1,
      windowStart: now,
    });

    return {
      allowed: true,
      remaining: options.max - 1,
      resetAt: now + windowMs,
    };
  }

  const timeSinceWindowStart = now - existing.windowStart;

  if (timeSinceWindowStart > windowMs) {
    rateLimitStore.set(key, {
      count: 1,
      windowStart: now,
    });

    return {
      allowed: true,
      remaining: options.max - 1,
      resetAt: now + windowMs,
    };
  }

  if (existing.count >= options.max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.windowStart + windowMs,
    };
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);

  return {
    allowed: true,
    remaining: options.max - existing.count,
    resetAt: existing.windowStart + windowMs,
  };
}

export function createRateLimitKey(userId: string, endpoint: string): string {
  return `rate_limit:${endpoint}:${userId}`;
}
