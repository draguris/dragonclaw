/**
 * LLM Caller — Production grade
 * 
 * - Retry with exponential backoff on 429/500
 * - Request timeout (60s)
 * - Structured error types
 */

import { retry } from './retry.js';
import { log } from './logger.js';

const llmLog = log.child('llm');

export class LLMError extends Error {
  constructor(message, { status, provider, retryable = false } = {}) {
    super(message);
    this.name = 'LLMError';
    this.status = status;
    this.provider = provider;
    this.retryable = retryable;
  }
}

export async function callLLM(llmConfig, messages) {
  const { provider } = llmConfig;
  const timeoutMs = llmConfig.timeoutMs || 60_000;
  const startTime = Date.now();

  if (!llmConfig.apiKey && provider !== 'local') {
    throw new LLMError(`No API key for ${provider}`, { provider });
  }

  const result = await retry(
    async (attempt) => {
      if (attempt > 0) llmLog.info('Retrying LLM call', { provider, attempt });
      return provider === 'anthropic'
        ? _callAnthropic(llmConfig, messages, timeoutMs)
        : _callOpenAICompat(llmConfig, messages, timeoutMs);
    },
    {
      maxRetries: 3,
      baseDelayMs: 2000,
      shouldRetry: (err) => err.status === 429 || err.status >= 500 || err.message?.includes('fetch failed') || err.message?.includes('ETIMEDOUT'),
      onRetry: (attempt, delay, err) => {
        llmLog.warn('LLM retry', { provider, attempt, delayMs: Math.round(delay), error: err.message });
      },
    }
  );

  llmLog.info('LLM complete', { provider, elapsed: Date.now() - startTime, chars: result.length });
  return result;
}

async function _callOpenAICompat(cfg, messages, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({ model: cfg.model, messages, max_tokens: cfg.maxTokens || 4096, temperature: cfg.temperature ?? 0.7 }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new LLMError(`${cfg.provider} ${res.status}: ${t.slice(0, 200)}`, { status: res.status, provider: cfg.provider, retryable: res.status >= 500 || res.status === 429 });
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new LLMError('Empty response', { provider: cfg.provider });
    return content;
  } catch (err) {
    if (err.name === 'AbortError') throw new LLMError(`Timeout after ${timeoutMs}ms`, { provider: cfg.provider, retryable: true });
    if (err instanceof LLMError) throw err;
    throw new LLMError(err.message, { provider: cfg.provider, retryable: true });
  } finally { clearTimeout(timeout); }
}

async function _callAnthropic(cfg, messages, timeoutMs) {
  const systemMsg = messages.find(m => m.role === 'system');
  const body = { model: cfg.model, max_tokens: cfg.maxTokens || 4096, temperature: cfg.temperature ?? 0.7, messages: messages.filter(m => m.role !== 'system') };
  if (systemMsg) body.system = systemMsg.content;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': cfg.apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new LLMError(`Anthropic ${res.status}: ${t.slice(0, 200)}`, { status: res.status, provider: 'anthropic', retryable: res.status >= 500 || res.status === 429 });
    }
    const data = await res.json();
    const content = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    if (!content) throw new LLMError('Empty Anthropic response', { provider: 'anthropic' });
    return content;
  } catch (err) {
    if (err.name === 'AbortError') throw new LLMError(`Anthropic timeout ${timeoutMs}ms`, { provider: 'anthropic', retryable: true });
    if (err instanceof LLMError) throw err;
    throw new LLMError(err.message, { provider: 'anthropic', retryable: true });
  } finally { clearTimeout(timeout); }
}
