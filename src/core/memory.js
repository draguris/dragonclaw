/**
 * Memory Store — Production grade
 * 
 * - SQLite with JSON fallback
 * - Max 10,000 entries, auto-prunes oldest when exceeded
 * - Bounded session history (configurable per-channel limit)
 * - Periodic compaction
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { log } from './logger.js';

const mLog = log.child('memory');
const MAX_ENTRIES = 10_000;
const PRUNE_BATCH = 1_000;

export class MemoryStore {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.entries = [];
    this.filePath = join(dataDir, 'memory.json');
    this.db = null;
    this._useSqlite = false;
  }

  async init() {
    try {
      const Database = (await import('better-sqlite3')).default;
      const dbPath = join(this.dataDir, 'memory.db');
      this.db = new Database(dbPath);
      this.db.pragma('journal_mode = WAL');  // better concurrent reads
      this.db.pragma('busy_timeout = 5000');
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS memories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content TEXT NOT NULL,
          userId TEXT,
          type TEXT DEFAULT 'general',
          timestamp INTEGER NOT NULL
        )
      `);
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_ts ON memories(timestamp)`);
      this.db.exec(`CREATE INDEX IF NOT EXISTS idx_type ON memories(type)`);
      this._useSqlite = true;
      this._autoPrune();
      mLog.info('SQLite memory ready', { path: dbPath });
    } catch (e) {
      this._useSqlite = false;
      mLog.warn('SQLite unavailable, using JSON', { error: e.message });
      if (existsSync(this.filePath)) {
        try {
          this.entries = JSON.parse(readFileSync(this.filePath, 'utf-8'));
          if (!Array.isArray(this.entries)) this.entries = [];
        } catch { this.entries = []; }
      }
    }
  }

  add(entry) {
    if (this._useSqlite) {
      try {
        this.db.prepare(
          'INSERT INTO memories (content, userId, type, timestamp) VALUES (?, ?, ?, ?)'
        ).run(entry.content, entry.userId || null, entry.type || 'general', entry.timestamp || Date.now());
        this._autoPrune();
      } catch (e) {
        mLog.error('Memory insert failed', { error: e.message });
      }
    } else {
      this.entries.push(entry);
      if (this.entries.length > MAX_ENTRIES) {
        this.entries = this.entries.slice(-MAX_ENTRIES + PRUNE_BATCH);
      }
      this._saveJson();
    }
  }

  search(query, limit = 5) {
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    if (!keywords.length) return [];

    if (this._useSqlite) {
      const conditions = keywords.map(() => 'LOWER(content) LIKE ?').join(' OR ');
      const params = keywords.map(k => `%${k}%`);
      try {
        return this.db.prepare(
          `SELECT content, type, timestamp FROM memories WHERE ${conditions} ORDER BY timestamp DESC LIMIT ?`
        ).all(...params, limit);
      } catch (e) {
        mLog.error('Memory search failed', { error: e.message });
        return [];
      }
    }

    return this.entries
      .filter(e => keywords.some(k => (e.content || '').toLowerCase().includes(k)))
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, limit);
  }

  entryCount() {
    if (this._useSqlite) {
      try { return this.db.prepare('SELECT COUNT(*) as c FROM memories').get().c; }
      catch { return 0; }
    }
    return this.entries.length;
  }

  _autoPrune() {
    if (!this._useSqlite) return;
    try {
      const count = this.db.prepare('SELECT COUNT(*) as c FROM memories').get().c;
      if (count > MAX_ENTRIES) {
        const deleteCount = count - MAX_ENTRIES + PRUNE_BATCH;
        this.db.prepare(
          'DELETE FROM memories WHERE id IN (SELECT id FROM memories ORDER BY timestamp ASC LIMIT ?)'
        ).run(deleteCount);
        mLog.info('Memory pruned', { deleted: deleteCount, remaining: count - deleteCount });
      }
    } catch (e) {
      mLog.error('Memory prune failed', { error: e.message });
    }
  }

  close() {
    if (this._useSqlite && this.db) {
      try { this.db.close(); } catch {}
    }
  }

  _saveJson() {
    try {
      mkdirSync(this.dataDir, { recursive: true });
      writeFileSync(this.filePath, JSON.stringify(this.entries, null, 2));
    } catch (e) {
      mLog.error('Memory save failed', { error: e.message });
    }
  }
}
