/**
 * Cron Scheduler
 * 
 * Manages scheduled tasks: heartbeat check-ins, periodic market scans, etc.
 * Uses node-cron for cron expressions.
 */

export class CronScheduler {
  constructor(config, agent) {
    this.config = config;
    this.agent = agent;
    this.jobs = [];
    this._cron = null;
  }

  async start() {
    try {
      const cronModule = await import('node-cron');
      this._cron = cronModule.default || cronModule;
    } catch {
      console.log('  ⚠ node-cron not available, scheduled tasks disabled');
      return;
    }

    // Heartbeat: proactive check-in
    if (this.config.agent.heartbeatCron) {
      const job = this._cron.schedule(this.config.agent.heartbeatCron, async () => {
        try {
          await this.agent.process(
            'system-heartbeat',
            'system',
            '这是你的定时心跳。检查一下有没有需要提醒用户的事情，或者主动提供有用的市场信息。如果没有什么重要的，简短地说一声就好。',
            'cron'
          );
        } catch (e) {
          console.warn('  ⚠ Heartbeat failed:', e.message);
        }
      });
      this.jobs.push(job);
    }
  }

  stop() {
    for (const job of this.jobs) {
      if (job.stop) job.stop();
    }
    this.jobs = [];
  }
}
