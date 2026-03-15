/**
 * Connector Manager
 * 
 * Dynamically loads and manages chat platform connectors.
 * Each connector translates platform messages ↔ agent.process() calls.
 */

import { TelegramConnector } from './telegram.js';
import { DingTalkConnector } from './dingtalk.js';
import { FeishuConnector } from './feishu.js';
import { DiscordConnector } from './discord.js';

const CONNECTOR_MAP = {
  telegram: TelegramConnector,
  dingtalk: DingTalkConnector,
  feishu: FeishuConnector,
  discord: DiscordConnector,
};

export class ConnectorManager {
  constructor(config, agent) {
    this.config = config;
    this.agent = agent;
    this.active = new Map();
  }

  async startAll() {
    for (const [name, ConnectorClass] of Object.entries(CONNECTOR_MAP)) {
      const connConfig = this.config.connectors[name];
      if (!connConfig?.enabled) continue;

      try {
        const connector = new ConnectorClass(connConfig, this.agent);
        await connector.start();
        this.active.set(name, connector);
      } catch (e) {
        console.warn(`  ⚠ Failed to start ${name}: ${e.message}`);
      }
    }
  }

  async stopAll() {
    for (const [name, connector] of this.active) {
      try {
        await connector.stop();
      } catch (e) {
        console.warn(`  ⚠ Failed to stop ${name}: ${e.message}`);
      }
    }
    this.active.clear();
  }

  activeNames() {
    return [...this.active.keys()];
  }
}
