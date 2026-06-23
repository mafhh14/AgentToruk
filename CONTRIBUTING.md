# Contributing to AgentToruk

Thank you for your interest in contributing!

## Development setup

1. Fork and clone the repository
2. Run `npm install`
3. Start Postgres: `docker compose up -d`
4. Copy `.env.example` to `.env`
5. Run `npm run db:generate && npm run db:push`
6. Run `npm run dev`

## Branching

- `main` — always deployable
- `feature/<name>` — new features
- `fix/<name>` — bug fixes
- `chore/<name>` — tooling, CI, docs

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(widget): add dark mode toggle
fix(rag): handle empty PDF extraction
docs(readme): update quick start
chore(ci): add prisma validate step
```

## Pull requests

- One logical change per PR
- Include a test plan in the PR description
- Update documentation for user-facing changes
- Ensure CI passes (`npm run build`, lint, typecheck)

## Code style

- TypeScript strict mode
- Match existing patterns in the codebase
- Keep business logic in `packages/`, not in API route handlers
- No secrets in commits

## Security

Report vulnerabilities via [SECURITY.md](SECURITY.md). Do not open public issues for security bugs.
