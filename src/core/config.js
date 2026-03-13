/**
 * Configuration loader
 * 
 * Priority: env vars > dragonclaw.yaml > defaults
 * Looks for config in: ./dragonclaw.yaml, ~/.dragonclaw/dragonclaw.yaml
 */

import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { parse as parseYaml } from 'yaml';

const DEFAULTS = {
  llm: {
    provider: null,       // 'deepseek' | 'qwen' | 'kimi' | 'glm' | 'openai' | 'anthropic' | 'openrouter' | 'local'
    model: null,
    apiKey: null,
    baseUrl: null,        // custom endpoint for local models or proxies
    maxTokens: 4096,
    temperature: 0.7,
  },
  binance: {
    apiKey: null,
    secretKey: null,
    testnet: true,        // default to testnet for safety
  },
  connectors: {
    telegram: { enabled: false, token: null },
    discord: { enabled: false, token: null },
    dingtalk: { enabled: false, appKey: null, appSecret: null, robotWebhook: null },
    feishu: { enabled: false, appId: null, appSecret: null },
    wechat: { enabled: false, mode: 'official-account', appId: null, appSecret: null },
    slack: { enabled: false, token: null, signingSecret: null },
    webchat: { enabled: false },
  },
  gateway: {
    port: 18789,
    host: '127.0.0.1',
  },
  agent: {
    name: '龙爪',
    persona: '你是龙爪 (DragonClaw)，一个加密原生的AI智能体。你能帮助用户进行币安交易、链上分析、日常自动化。你说话简洁有力，中英文切换自如。',
    language: 'zh',       // 'zh' | 'en' | 'auto'
    confirmBeforeTrade: true,
    heartbeatCron: '0 9 * * *',  // daily at 9am
  },
  skills: {
    userDir: null,         // resolved below
    allowRemoteInstall: true,
  },
  paths: {
    data: null,            // resolved below
    workspace: null,
  },
};

// Known LLM provider endpoints
const PROVIDER_ENDPOINTS = {
  deepseek: { baseUrl: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat' },
  qwen: { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModel: 'qwen-max' },
  kimi: { baseUrl: 'https://api.moonshot.cn/v1', defaultModel: 'moonshot-v1-128k' },
  glm: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', defaultModel: 'glm-4-flash' },
  openai: { baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o' },
  anthropic: { baseUrl: 'https://api.anthropic.com/v1', defaultModel: 'claude-sonnet-4-20250514' },
  openrouter: { baseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'deepseek/deepseek-chat' },
};

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

export async function loadConfig() {
  // Determine config file location
  const localPath = join(process.cwd(), 'dragonclaw.yaml');
  const homePath = join(homedir(), '.dragonclaw', 'dragonclaw.yaml');
  const configPath = existsSync(localPath) ? localPath : existsSync(homePath) ? homePath : null;

  let fileConfig = {};
  if (configPath) {
    try {
      const raw = readFileSync(configPath, 'utf-8');
      fileConfig = parseYaml(raw) || {};
    } catch (e) {
      console.warn(`  ⚠ Failed to parse ${configPath}: ${e.message}`);
    }
  }

  // Merge: defaults ← file config
  let config = deepMerge(DEFAULTS, fileConfig);

  // Env var overrides
  if (process.env.DRAGONCLAW_LLM_PROVIDER) config.llm.provider = process.env.DRAGONCLAW_LLM_PROVIDER;
  if (process.env.DRAGONCLAW_LLM_API_KEY) config.llm.apiKey = process.env.DRAGONCLAW_LLM_API_KEY;
  if (process.env.DRAGONCLAW_LLM_MODEL) config.llm.model = process.env.DRAGONCLAW_LLM_MODEL;
  if (process.env.BINANCE_API_KEY) config.binance.apiKey = process.env.BINANCE_API_KEY;
  if (process.env.BINANCE_API_SECRET) config.binance.secretKey = process.env.BINANCE_API_SECRET;
  if (process.env.TELEGRAM_BOT_TOKEN) {
    config.connectors.telegram.enabled = true;
    config.connectors.telegram.token = process.env.TELEGRAM_BOT_TOKEN;
  }

  // Resolve provider defaults
  if (config.llm.provider && PROVIDER_ENDPOINTS[config.llm.provider]) {
    const prov = PROVIDER_ENDPOINTS[config.llm.provider];
    if (!config.llm.baseUrl) config.llm.baseUrl = prov.baseUrl;
    if (!config.llm.model) config.llm.model = prov.defaultModel;
  }

  // Resolve paths
  const dataDir = join(homedir(), '.dragonclaw');
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  config.paths.data = config.paths.data || dataDir;
  config.paths.workspace = config.paths.workspace || process.cwd();
  config.skills.userDir = config.skills.userDir || join(dataDir, 'skills');
  if (!existsSync(config.skills.userDir)) mkdirSync(config.skills.userDir, { recursive: true });

  return config;
}

export { PROVIDER_ENDPOINTS };
