# Contributing to DragonClaw 龙爪

Thanks for your interest in contributing. Here's how to get started.

## Getting Started

```bash
git clone https://github.com/draguris/dragonclaw.git
cd dragonclaw
npm install
npm test           # run the test suite
npm run dev        # start in dev mode (auto-restart on changes)
```

## What You Can Contribute

**Skills** — write SKILL.md files for new APIs, services, or workflows. See [Writing Custom Skills](docs/skills/custom-skills.md).

**Connectors** — add support for new chat platforms. See [Connector Development](docs/contributing/connectors.md).

**Bug Fixes** — find and fix issues in the core runtime.

**Documentation** — improve guides, add examples, translate to Chinese or other languages.

**Testing** — add test coverage for untested modules.

## Submitting a Pull Request

1. Fork the repository
2. Create a branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test` (all 20 must pass)
5. Commit with a clear message describing what changed and why
6. Push and open a Pull Request

## Code Style

- ES Modules (`import`/`export`, not `require`)
- No TypeScript — vanilla JavaScript, keeping dependencies minimal
- Structured JSON logging via `src/core/logger.js` — no `console.log`
- Functional where possible, classes for stateful components
- Chinese-first user-facing text, bilingual where practical

## Skill Contributions

The easiest way to contribute is writing a new skill:

1. Create a directory in `src/skills/` or `~/.dragonclaw/skills/`
2. Add a `SKILL.md` file with YAML frontmatter + Markdown instructions
3. Test with `node src/cli.js chat`
4. Submit a PR

See the existing Binance skills in `src/skills/binance/` for examples.

## Connector Contributions

Every connector needs:
- A class with `constructor(config, agent)`, `start()`, `stop()`
- Registration in `src/connectors/manager.js`
- Config schema in `src/core/config.js`
- A documentation page in `docs/connectors/`

## Questions?

Open a [Discussion](https://github.com/draguris/dragonclaw/discussions) or join the [X Community](https://x.com/i/communities/2032492964522389747/).

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
