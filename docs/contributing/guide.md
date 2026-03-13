# How to Contribute

DragonClaw is open source under the MIT license. We welcome contributions of all kinds.

## Ways to Contribute

- **Skills** — write new SKILL.md files for services, APIs, or workflows
- **Connectors** — add support for new chat platforms
- **Bug fixes** — find and fix issues in the core runtime
- **Documentation** — improve guides, add examples, translate
- **Testing** — add test coverage

## Development Setup

```bash
git clone https://github.com/draguris/dragonclaw.git
cd dragonclaw
npm install

# Run tests
npm test

# Start in dev mode (auto-restart on file changes)
npm run dev

# Run the onboard wizard
node src/cli.js onboard
```

## Project Structure

```
src/
├── core/           # Runtime engine — agent loop, LLM, memory, gateway
├── connectors/     # Chat platform integrations
├── skills/binance/ # Hardcoded Binance skills
test/               # Test suite (Node built-in test runner)
deploy/             # VPS deployment scripts
docs/               # GitBook documentation
web/                # Landing page
```

## Code Style

- ES Modules (`import/export`)
- No TypeScript (keeping it simple and dependency-light)
- Functional where possible, classes for stateful components
- Structured JSON logging via `src/core/logger.js`
- No frameworks — vanilla Node.js with minimal dependencies

## Submitting Changes

1. Fork the repository
2. Create a branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit with a clear message
6. Open a Pull Request

## Adding a Skill

See [Writing Custom Skills](skills.md) for the full guide. Quick version:

1. Create `src/skills/my-provider/my-skill/SKILL.md`
2. Follow the YAML frontmatter + Markdown body format
3. Test with `dragonclaw chat`
4. Submit PR

## Adding a Connector

See [Connector Development](connectors.md). Your connector needs:

1. A class with `constructor(config, agent)`, `start()`, `stop()` methods
2. Registration in `src/connectors/manager.js`
3. Config schema additions in `src/core/config.js`
4. A doc page in `docs/connectors/`
5. Test coverage
