/**
 * DragonClaw Test Suite
 * 
 * Run: node --test test/index.test.js
 * Uses Node.js built-in test runner (no extra dependencies).
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

// ── Rate Limiter ──

describe('RateLimiter', async () => {
  const { RateLimiter } = await import('../src/core/rate-limiter.js');

  it('allows requests under limit', () => {
    const rl = new RateLimiter({ perUser: 5, global: 100, windowMs: 60000 });
    for (let i = 0; i < 5; i++) {
      assert.equal(rl.check('user1').allowed, true);
    }
    rl.destroy();
  });

  it('blocks requests over per-user limit', () => {
    const rl = new RateLimiter({ perUser: 3, global: 100, windowMs: 60000 });
    rl.check('user1');
    rl.check('user1');
    rl.check('user1');
    const result = rl.check('user1');
    assert.equal(result.allowed, false);
    assert.ok(result.retryAfterMs > 0);
    rl.destroy();
  });

  it('tracks users independently', () => {
    const rl = new RateLimiter({ perUser: 2, global: 100, windowMs: 60000 });
    rl.check('user1');
    rl.check('user1');
    assert.equal(rl.check('user1').allowed, false);
    assert.equal(rl.check('user2').allowed, true);
    rl.destroy();
  });

  it('blocks on global limit', () => {
    const rl = new RateLimiter({ perUser: 100, global: 3, windowMs: 60000 });
    rl.check('a');
    rl.check('b');
    rl.check('c');
    assert.equal(rl.check('d').allowed, false);
    rl.destroy();
  });
});

// ── Secrets ──

describe('Secrets', async () => {
  const { encrypt, decrypt, isEncrypted, resolveSecret } = await import('../src/core/secrets.js');

  it('encrypts and decrypts round-trip', () => {
    const original = 'sk-my-secret-api-key-12345';
    const encrypted = encrypt(original);
    assert.ok(isEncrypted(encrypted));
    assert.notEqual(encrypted, original);
    const decrypted = decrypt(encrypted);
    assert.equal(decrypted, original);
  });

  it('returns plaintext if not encrypted', () => {
    assert.equal(decrypt('plain-value'), 'plain-value');
  });

  it('isEncrypted returns false for plain text', () => {
    assert.equal(isEncrypted('hello'), false);
    assert.equal(isEncrypted(''), false);
    assert.equal(isEncrypted(null), false);
  });

  it('resolveSecret prefers env var', () => {
    process.env.__TEST_SECRET = 'from-env';
    const result = resolveSecret('__TEST_SECRET', 'from-config');
    assert.equal(result, 'from-env');
    delete process.env.__TEST_SECRET;
  });

  it('resolveSecret falls back to config', () => {
    const result = resolveSecret('__NONEXISTENT_KEY', 'fallback-value');
    assert.equal(result, 'fallback-value');
  });

  it('resolveSecret decrypts encrypted config', () => {
    const encrypted = encrypt('secret-value');
    const result = resolveSecret('__NONEXISTENT_KEY', encrypted);
    assert.equal(result, 'secret-value');
  });
});

// ── Retry ──

describe('retry', async () => {
  const { retry } = await import('../src/core/retry.js');

  it('succeeds on first try', async () => {
    let calls = 0;
    const result = await retry(async () => { calls++; return 'ok'; });
    assert.equal(result, 'ok');
    assert.equal(calls, 1);
  });

  it('retries on failure then succeeds', async () => {
    let calls = 0;
    const result = await retry(async () => {
      calls++;
      if (calls < 3) {
        const err = new Error('fail');
        err.status = 500;
        throw err;
      }
      return 'recovered';
    }, { baseDelayMs: 10 });
    assert.equal(result, 'recovered');
    assert.equal(calls, 3);
  });

  it('throws after max retries', async () => {
    let calls = 0;
    await assert.rejects(
      () => retry(async () => {
        calls++;
        const err = new Error('always fails');
        err.status = 500;
        throw err;
      }, { maxRetries: 2, baseDelayMs: 10 }),
      { message: 'always fails' }
    );
    assert.equal(calls, 3); // initial + 2 retries
  });

  it('does not retry non-retryable errors', async () => {
    let calls = 0;
    await assert.rejects(
      () => retry(async () => {
        calls++;
        const err = new Error('bad request');
        err.status = 400;
        throw err;
      }, { baseDelayMs: 10 }),
      { message: 'bad request' }
    );
    assert.equal(calls, 1); // no retries
  });
});

// ── Skill Manager ──

describe('SkillManager', async () => {
  const { SkillManager } = await import('../src/core/skill-manager.js');

  it('loads core Binance skills', async () => {
    const config = {
      skills: { userDir: '/tmp/dragonclaw-test-skills-' + Date.now() },
    };
    const sm = new SkillManager(config);
    await sm.loadAll();
    assert.ok(sm.coreCount() >= 7, `Expected >= 7 core skills, got ${sm.coreCount()}`);
  });

  it('finds relevant skills by keyword', async () => {
    const config = {
      skills: { userDir: '/tmp/dragonclaw-test-skills-' + Date.now() },
    };
    const sm = new SkillManager(config);
    await sm.loadAll();
    const meme = sm.findRelevant('show me trending meme tokens');
    assert.ok(meme.some(s => s.slug === 'meme-rush'), 'Should find meme-rush skill');
  });

  it('finds spot trading skill', async () => {
    const config = {
      skills: { userDir: '/tmp/dragonclaw-test-skills-' + Date.now() },
    };
    const sm = new SkillManager(config);
    await sm.loadAll();
    const spot = sm.findRelevant('buy 0.1 BTC on binance spot');
    assert.ok(spot.some(s => s.slug === 'binance-spot'), 'Should find spot skill');
  });

  it('builds skill prompt with XML tags', async () => {
    const config = {
      skills: { userDir: '/tmp/dragonclaw-test-skills-' + Date.now() },
    };
    const sm = new SkillManager(config);
    await sm.loadAll();
    const skills = sm.findRelevant('audit this token contract');
    const prompt = sm.buildSkillPrompt(skills);
    assert.ok(prompt.includes('<skill'), 'Prompt should contain <skill> tags');
    assert.ok(prompt.includes('</skill>'), 'Prompt should contain closing tags');
  });
});

// ── Logger ──

describe('Logger', async () => {
  const { Logger } = await import('../src/core/logger.js');

  it('creates child loggers', () => {
    const parent = new Logger('parent');
    const child = parent.child('child');
    assert.equal(child.module, 'child');
  });

  it('respects log level', () => {
    const logger = new Logger('test');
    logger.level = 3; // error only
    // debug/info/warn should be suppressed — no easy way to assert without capturing stdout
    // but at least verify it doesn't throw
    logger.debug('suppressed');
    logger.info('suppressed');
    logger.warn('suppressed');
    logger.error('shown');
  });
});

console.log('\n  All test suites registered. Running...\n');
