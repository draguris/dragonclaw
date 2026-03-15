/**
 * Rate Limiter — Token bucket algorithm
 * 
 * Prevents abuse: limits messages per user per time window.
 * Defaults: 20 messages per minute per user, 100 per minute globally.
 */

export class RateLimiter {
  constructor(opts = {}) {
    this.perUser = opts.perUser || 20;        // max per user per window
    this.global = opts.global || 100;          // max global per window
    this.windowMs = opts.windowMs || 60_000;   // 1 minute
    this.buckets = new Map();                  // userId → { count, resetAt }
    this.globalBucket = { count: 0, resetAt: Date.now() + this.windowMs };

    // Prune stale buckets every 5 minutes
    this._pruneInterval = setInterval(() => this._prune(), 300_000);
  }

  /**
   * Check if a request is allowed.
   * @returns {{ allowed: boolean, retryAfterMs?: number }}
   */
  check(userId) {
    const now = Date.now();

    // Global bucket
    if (now > this.globalBucket.resetAt) {
      this.globalBucket = { count: 0, resetAt: now + this.windowMs };
    }
    if (this.globalBucket.count >= this.global) {
      return { allowed: false, retryAfterMs: this.globalBucket.resetAt - now };
    }

    // Per-user bucket
    let bucket = this.buckets.get(userId);
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + this.windowMs };
      this.buckets.set(userId, bucket);
    }
    if (bucket.count >= this.perUser) {
      return { allowed: false, retryAfterMs: bucket.resetAt - now };
    }

    // Allow
    bucket.count++;
    this.globalBucket.count++;
    return { allowed: true };
  }

  _prune() {
    const now = Date.now();
    for (const [key, bucket] of this.buckets) {
      if (now > bucket.resetAt) this.buckets.delete(key);
    }
  }

  destroy() {
    clearInterval(this._pruneInterval);
  }
}
