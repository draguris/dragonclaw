/**
 * Skill Manager
 * 
 * Loads skills from two sources:
 * 1. Core skills: ./skills/binance/* (hardcoded, ship with DragonClaw)
 * 2. User skills: ~/.dragonclaw/skills/* (user-installed, OpenClaw compatible)
 * 
 * Each skill is a directory containing a SKILL.md file with YAML frontmatter.
 * The SKILL.md content is injected into the LLM system prompt when the skill is relevant.
 */

import { readdirSync, readFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CORE_SKILLS_DIR = join(__dirname, '..', 'skills', 'binance');

export class SkillManager {
  constructor(config) {
    this.config = config;
    this.coreSkills = new Map();   // hardcoded Binance skills
    this.userSkills = new Map();   // user-installed skills
  }

  async loadAll() {
    this._loadFromDir(CORE_SKILLS_DIR, this.coreSkills, 'core');
    if (this.config.skills.userDir && existsSync(this.config.skills.userDir)) {
      this._loadFromDir(this.config.skills.userDir, this.userSkills, 'user');
    }
  }

  _loadFromDir(dir, targetMap, source) {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const skillPath = join(dir, entry.name, 'SKILL.md');
      if (!existsSync(skillPath)) continue;

      try {
        const raw = readFileSync(skillPath, 'utf-8');
        const skill = this._parseSkillMd(raw, entry.name, source);
        skill.path = join(dir, entry.name);
        targetMap.set(skill.slug, skill);
      } catch (e) {
        console.warn(`  ⚠ Failed to load skill ${entry.name}: ${e.message}`);
      }
    }
  }

  _parseSkillMd(raw, dirName, source) {
    // Parse YAML frontmatter between --- markers
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    let meta = {};
    let body = raw;

    if (fmMatch) {
      const fmLines = fmMatch[1].split('\n');
      for (const line of fmLines) {
        const [key, ...valParts] = line.split(':');
        if (key && valParts.length) {
          meta[key.trim()] = valParts.join(':').trim();
        }
      }
      body = fmMatch[2];
    }

    return {
      slug: meta.slug || dirName,
      title: meta.title || meta.name || dirName,
      description: meta.description || '',
      version: meta.version || '0.0.0',
      author: meta.author || 'unknown',
      source,
      body,          // the full instruction text for the LLM
      requiresAuth: body.includes('API_KEY') || body.includes('Secret'),
      meta,
    };
  }

  /**
   * Get all skills as an array
   */
  all() {
    return [...this.coreSkills.values(), ...this.userSkills.values()];
  }

  /**
   * Find skills relevant to a user message.
   * Simple keyword matching — can be upgraded to embeddings later.
   */
  findRelevant(message) {
    const lower = message.toLowerCase();
    const relevant = [];

    for (const skill of this.all()) {
      const keywords = [
        skill.slug, skill.title,
        ...(skill.description || '').split(/\s+/),
      ].map(k => k.toLowerCase());

      const match = keywords.some(kw => kw.length > 2 && lower.includes(kw));
      if (match) relevant.push(skill);
    }

    // If no keyword match, include core skills with no auth requirement
    // (free Binance data skills are always useful context)
    if (relevant.length === 0) {
      for (const skill of this.coreSkills.values()) {
        if (!skill.requiresAuth) relevant.push(skill);
      }
    }

    return relevant;
  }

  /**
   * Build a system prompt section from relevant skills
   */
  buildSkillPrompt(skills) {
    if (!skills.length) return '';
    const sections = skills.map(s =>
      `<skill name="${s.title}" slug="${s.slug}">\n${s.body}\n</skill>`
    );
    return `\n\n## Available Skills\n\n${sections.join('\n\n')}`;
  }

  /**
   * Install a skill from a GitHub URL or local path
   */
  async install(source) {
    // TODO: git clone or copy, validate SKILL.md, add to userSkills
    throw new Error('Remote skill install not yet implemented. Copy skill folder to ' + this.config.skills.userDir);
  }

  coreCount() { return this.coreSkills.size; }
  userCount() { return this.userSkills.size; }
}
