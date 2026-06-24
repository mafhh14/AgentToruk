# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.0] - 2026-06-23

### Added

- Gemini File Search RAG provider: per-org store creation, document upload, semantic search, delete
- Knowledge ingest and agent search respect organization `ragProvider` setting
- Agent dashboard control to switch between pgvector and Gemini File Search
- `GEMINI_RAG_MODEL` env var for retrieval query model (default `gemini-2.0-flash`)

## [0.8.0] - 2026-06-23

### Added

- Widget theme editor at `/dashboard/widget` with live preview
- Admin API to get, update, and reset widget theme per organization
- Color pickers for light/dark palettes, position, welcome message, border radius
- Sidebar link and settings cross-link to theme editor

## [0.7.0] - 2026-06-23

### Added

- Socket.io realtime server (`apps/realtime`) for live chat during human handoff
- Live handoff queue page with claim/takeover flow
- Real-time message delivery between widget and admin agents
- Typing indicators for visitors and agents
- Escalated conversations skip AI auto-reply and wait for human agents

## [0.6.0] - 2026-06-23

### Added

- Tickets API: list, create, update, add notes
- Admin tickets list with status filters and search
- Ticket detail page with status/priority/assignee controls and internal notes
- Link tickets to conversations from detail view

## [0.5.0] - 2026-06-23

### Added

- Full pgvector RAG pipeline: chunking, OpenAI embeddings, similarity search
- Knowledge upload API (PDF, TXT, MD files + URLs)
- Document list, delete, and re-index in admin UI
- Text extraction from PDF and web pages
- Agent `search_knowledge_base` tool now returns real citations when docs are indexed

## [0.4.0] - 2026-06-23

### Added

- Full agent orchestrator pipeline: guardrails → intent → plan → tools → generate
- Intent classification (FAQ, billing, refund, order, technical, human request, etc.)
- Tool registry: `search_knowledge_base`, `create_ticket`, `escalate_to_human`
- Confidence scoring and automatic handoff decisions
- Per-stage agent audit logs
- Message metadata: intent, sentiment, confidence, actions taken, sources
- Agent dashboard with pipeline overview and recent logs

## [0.3.0] - 2026-06-23

### Added

- Conversation persistence (create, list, detail, update status)
- Message API for widget and admin human replies
- Public widget API (`/api/v1/conversations`) with CORS
- Admin conversations list with search and status filters
- Conversation detail page with message thread and agent reply
- Widget connected to real backend API
- Widget demo page at `/widget-demo`
- Dashboard shows live conversation stats and recent chats
- Optional AI responses when OpenAI/Gemini API key is configured

## [0.2.0] - 2026-06-23

### Added

- NextAuth.js credentials authentication (email/password)
- Organization registration with automatic bootstrap (AgentConfig, WidgetTheme)
- JWT sessions with organization ID and role
- RBAC permission system (Owner, Admin, Support Agent, Viewer)
- Protected dashboard routes via middleware
- Team API: list members and invite users
- Login and register pages with form validation
- Sidebar shows org, user, role, and sign out

## [0.1.0] - 2026-06-23

### Added

- Monorepo scaffold with npm workspaces and Turborepo
- PostgreSQL + Prisma schema with pgvector support
- Pluggable LLM adapters (OpenAI, Gemini)
- Pluggable RAG adapters (pgvector, Gemini File Search stubs)
- Agent engine skeleton
- Next.js admin dashboard shell with all main pages
- Embeddable chat widget stub with theme support
- Widget config API endpoint
- Docker Compose for local PostgreSQL
- GitHub Actions CI pipeline
- Documentation (README, CONTRIBUTING, docs/)

[0.1.0]: https://github.com/your-org/agenttoruk/releases/tag/v0.1.0
