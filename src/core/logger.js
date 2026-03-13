/**
 * Logger — Production-grade structured logging
 * 
 * Outputs JSON lines for easy parsing by log aggregators.
 * Supports levels: debug, info, warn, error, fatal.
 * Writes to stdout (info+) and stderr (error+) so Docker/systemd captures correctly.
 */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 };

class Logger {
  constructor(module = 'core') {
    this.module = module;
    this.level = LEVELS[process.env.LOG_LEVEL || 'info'] ?? LEVELS.info;
  }

  child(module) {
    const child = new Logger(module);
    child.level = this.level;
    return child;
  }

  _emit(level, msg, meta = {}) {
    if (LEVELS[level] < this.level) return;
    const entry = {
      ts: new Date().toISOString(),
      level,
      module: this.module,
      msg,
      ...meta,
    };
    const line = JSON.stringify(entry);
    if (LEVELS[level] >= LEVELS.error) {
      process.stderr.write(line + '\n');
    } else {
      process.stdout.write(line + '\n');
    }
  }

  debug(msg, meta) { this._emit('debug', msg, meta); }
  info(msg, meta) { this._emit('info', msg, meta); }
  warn(msg, meta) { this._emit('warn', msg, meta); }
  error(msg, meta) { this._emit('error', msg, meta); }
  fatal(msg, meta) { this._emit('fatal', msg, meta); }
}

export const log = new Logger('dragonclaw');
export { Logger };
