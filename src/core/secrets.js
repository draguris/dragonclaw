/**
 * Secrets Manager
 * 
 * Handles sensitive configuration (API keys, tokens):
 * 1. Prefers environment variables (never touches disk)
 * 2. If stored in config, encrypts at rest using a machine-derived key
 * 3. Provides a secure way to access secrets at runtime
 * 
 * Machine key derivation: HMAC-SHA256(hostname + username, "dragonclaw-v1")
 * This means encrypted configs are tied to the machine they were created on.
 */

import { createCipheriv, createDecipheriv, randomBytes, createHmac } from 'crypto';
import { hostname, userInfo } from 'os';

const ALGO = 'aes-256-gcm';
const PREFIX = 'enc:v1:';  // marks encrypted values in config

function deriveKey() {
  const identity = `${hostname()}:${userInfo().username}`;
  return createHmac('sha256', 'dragonclaw-v1').update(identity).digest();
}

export function encrypt(plaintext) {
  const key = deriveKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGO, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${PREFIX}${iv.toString('hex')}:${tag}:${encrypted}`;
}

export function decrypt(ciphertext) {
  if (!ciphertext.startsWith(PREFIX)) return ciphertext; // not encrypted
  const parts = ciphertext.slice(PREFIX.length).split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted format');
  const [ivHex, tagHex, encHex] = parts;
  const key = deriveKey();
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  let decrypted = decipher.update(encHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Resolve a secret value: env var > decrypted config value
 */
export function resolveSecret(envKey, configValue) {
  // Environment variable always wins
  const envVal = process.env[envKey];
  if (envVal) return envVal;

  // If config value is encrypted, decrypt it
  if (configValue && typeof configValue === 'string') {
    if (configValue.startsWith(PREFIX)) {
      return decrypt(configValue);
    }
    return configValue;
  }

  return null;
}

export function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith(PREFIX);
}
