# AgentToruk

**Open-source AI agents that understand, decide, and solve real-world user issues.**

AgentToruk is an enterprise-grade customer support platform with an AI chat agent, RAG knowledge base, ticketing, human handoff, workflow automation, and integrations.

## Features

- **AI Agent Engine** — intent detection, planning, tools, confidence scoring, handoff
- **Chat Widget** — embeddable, customizable (colors, fonts, light/dark mode)
- **Knowledge Base / RAG** — pgvector or Gemini File Search with citations
- **Ticketing** — full lifecycle from chat escalations
- **Human Handoff** — seamless transfer to support agents
- **Admin Dashboard** — conversations, tickets, analytics, team management
- **Pluggable providers** — OpenAI or Gemini for LLM; pgvector or Gemini File Search for RAG

## Tech stack

- Next.js 14, TypeScript, Tailwind CSS
- PostgreSQL + Prisma + pgvector
- Monorepo (npm workspaces + Turborepo)
- OpenAI API / Google Gemini API

## Quick start

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

### Setup

```bash
# Clone and install
git clone <your-repo-url> agenttoruk
cd agenttoruk
npm install

# Start PostgreSQL with pgvector
docker compose up -d

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Start development
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page and [http://localhost:3000/dashboard](http://localhost:3000/dashboard) for the admin panel.

## Project structure

```
agenttoruk/
├── apps/
│   ├── web/                 # Next.js admin dashboard + API
│   └── widget/              # Embeddable chat widget (Vite)
├── packages/
│   ├── database/            # Prisma schema + client
│   ├── shared/              # Shared types and constants
│   ├── llm/                 # OpenAI + Gemini adapters
│   ├── rag/                 # pgvector + Gemini File Search adapters
│   └── agent-engine/        # Core AI orchestrator
├── docs/                    # Documentation
└── docker-compose.yml
```

## Documentation

- [Getting started](docs/getting-started/quick-start.md)
- [Environment variables](docs/getting-started/environment-variables.md)
- [Architecture](docs/developer-guide/architecture.md)
- [FAQ](docs/help/faq.md)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps in development |
| `npm run build` | Build all packages and apps |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |

## Roadmap

- [x] Phase 0 — Monorepo scaffold, schema, admin shell, widget stub
- [x] Phase 2 — Authentication + RBAC
- [ ] Phase 6 — Agent orchestrator + OpenAI/Gemini
- [ ] Phase 7 — RAG ingestion + search
- [ ] Phase 9 — Ticketing module
- [ ] Phase 10 — Human handoff + realtime

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
