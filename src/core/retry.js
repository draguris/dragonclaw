/**
 * Retry with exponential backoff + jitter
 * 
 * Used for LLM API calls, Binance API calls, and connector operations.
 */

export async function retry(fn, opts = {}) {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30_000,
    shouldRetry = (err) => {
      // Retry on network errors, 429 (rate limit), 500-599
      if (err.status === 429) return true;
      if (err.status >= 500) return true;
      if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') return true;
      if (err.message?.includes('fetch failed')) return true;
      return false;
    },
    onRetry = () => {},
  } = opts;

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      if (attempt >= maxRetries || !shouldRetry(err)) {
        throw err;
      }
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt) + Math.random() * 500,
        maxDelayMs
      );
      onRetry(attempt + 1, delay, err);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}
