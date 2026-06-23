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

### Shipped

| Phase | Milestone | Release |
|-------|-----------|---------|
| **0** | Monorepo scaffold, schema, admin shell, widget stub | `v0.1.0` |
| **2** | Authentication + RBAC | `v0.2.0` |
| **6** | Agent orchestrator + OpenAI/Gemini | `v0.4.0` |
| **7** | RAG ingestion + search (pgvector) | `v0.5.0` |
| **9** | Ticketing module | `v0.6.0` |
| **10** | Human handoff + Socket.io realtime | `v0.7.0` |
| **11** | Widget theme editor | `v0.8.0` |

Also delivered between phases: **conversations API + widget wiring** (`v0.3.0`).

### Upcoming

| Phase | Milestone |
|-------|-----------|
| **12** | Gemini File Search RAG adapter (MySQL-friendly vector strategy) |
| **13** | Analytics dashboard + CSAT |
| **14** | Workflow automation |
| **15** | Public API, webhooks, and integrations |

See [CHANGELOG.md](CHANGELOG.md) for release notes.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
