#!/usr/bin/env node

/**
 * DragonClaw 龙爪 — Main Gateway (Production)
 */

import { loadConfig } from './core/config.js';
import { SkillManager } from './core/skill-manager.js';
import { AgentLoop } from './core/agent-loop.js';
import { MemoryStore } from './core/memory.js';
import { ConnectorManager } from './connectors/manager.js';
import { Gateway } from './core/gateway.js';
import { CronScheduler } from './core/cron.js';
import { log } from './core/logger.js';

const VERSION = '0.1.0';

// ── Uncaught error handling ──
process.on('uncaughtException', (err) => {
  log.fatal('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection', { error: String(reason), stack: reason?.stack });
});

async function main() {
  log.info(`DragonClaw v${VERSION} starting`);

  // 1. Load config
  const config = await loadConfig();
  if (!config.llm?.provider) {
    log.fatal('No LLM provider configured. Run: dragonclaw onboard');
    process.exit(1);
  }
  log.info('Config loaded', { llm: `${config.llm.provider}/${config.llm.model}` });

  // 2. Memory
  const memory = new MemoryStore(config.paths.data);
  await memory.init();
  log.info('Memory ready', { entries: memory.entryCount() });

  // 3. Skills
  const skills = new SkillManager(config);
  await skills.loadAll();
  log.info('Skills loaded', { core: skills.coreCount(), user: skills.userCount() });

  // 4. Agent
  const agent = new AgentLoop({ config, skills, memory });

  // 5. Connectors
  const connectors = new ConnectorManager(config, agent);
  await connectors.startAll();
  log.info('Connectors active', { names: connectors.activeNames() });

  // 6. Cron
  const cron = new CronScheduler(config, agent);
  cron.start();

  // 7. Gateway
  const gateway = new Gateway(config, agent, connectors, skills);
  await gateway.listen();

  log.info('DragonClaw ready', { port: config.gateway.port });

  // ── Graceful shutdown ──
  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    log.info('Shutting down', { signal });
    const timeout = setTimeout(() => { log.error('Shutdown timeout, force exit'); process.exit(1); }, 10_000);
    try {
      cron.stop();
      await connectors.stopAll();
      await gateway.close();
      memory.close();
    } catch (e) {
      log.error('Shutdown error', { error: e.message });
    }
    clearTimeout(timeout);
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch(err => {
  log.fatal('Startup failed', { error: err.message, stack: err.stack });
  process.exit(1);
});
