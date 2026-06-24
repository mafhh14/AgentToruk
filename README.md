# AgentToruk

**Open-source AI agents that understand, decide, and solve real-world user issues.**

AgentToruk is an enterprise-grade customer support platform with an AI chat agent, RAG knowledge base, ticketing, human handoff, workflow automation, and integrations.

## Goal

**Give every team an AI support agent they actually own.**

Most support AI is a black box: rented, opaque, and locked to one vendor. AgentToruk is the open-source alternative — self-hostable, provider-flexible, and built for teams who want AI that **understands context**, **takes action**, and **knows when to hand off to a human**.

We’re building this in the open so developers, startups, and enterprises can ship production-grade customer support without surrendering their data, their stack, or their roadmap.

## Features

- **AI Agent Engine** — intent detection, planning, tools, confidence scoring, handoff
- **Chat Widget** — embeddable, customizable (colors, fonts, light/dark mode)
- **Knowledge Base / RAG** — pgvector or Gemini File Search with citations
- **Ticketing** — full lifecycle from chat escalations
- **Human Handoff** — seamless transfer to support agents
- **Admin Dashboard** — conversations, tickets, analytics, team management
- **Pluggable providers** — OpenAI or Gemini for LLM; pgvector or Gemini File Search for RAG
- **Industry packs** — hospitality, travel, and general templates with vertical intents and tools

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
│   ├── industry-packs/      # Vertical templates (hospitality, travel, …)
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

• `v0.1.0` — **Phase 0** — Monorepo scaffold, schema, admin shell, widget stub  
• `v0.2.0` — **Phase 2** — Authentication + RBAC  
• `v0.3.0` — **Phase 3** — Conversations API + widget wiring  
• `v0.4.0` — **Phase 6** — Agent orchestrator + OpenAI/Gemini  
• `v0.5.0` — **Phase 7** — RAG ingestion + search (pgvector)  
• `v0.6.0` — **Phase 9** — Ticketing module  
• `v0.7.0` — **Phase 10** — Human handoff + Socket.io realtime  
• `v0.8.0` — **Phase 11** — Widget theme editor  
• `v0.9.0` — **Phase 12** — Gemini File Search RAG adapter  
• `v1.0.0` — **Phases 13–18** — Analytics, workflows list, API keys, industry packs (hospitality & travel)  

Phases **1**, **4**, **5**, and **8** are reserved / not yet scheduled.

### Upcoming

• **Phase 19** — Community industry pack contributions guide  
• **Phase 20** — Live integration connectors (PMS, booking APIs)  
• **Phase 21** — Workflow rule editor + runtime execution  

See [CHANGELOG.md](CHANGELOG.md) for release notes.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
