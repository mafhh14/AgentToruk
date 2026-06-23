# Architecture

## Monorepo layout

```
apps/web          Next.js 14 — admin dashboard + REST API
apps/widget       Vite — embeddable chat widget bundle
packages/database Prisma ORM + PostgreSQL schema
packages/shared   Shared TypeScript types
packages/llm      LLM provider adapters (OpenAI, Gemini)
packages/rag      RAG provider adapters (pgvector, Gemini File Search)
packages/agent-engine  Core AI orchestration pipeline
```

## Agent pipeline

Every user message flows through:

1. **Understand** — intent, sentiment, risk classification
2. **Retrieve** — RAG search + customer memory
3. **Plan** — decide steps and tools
4. **Execute** — run tools (ticket, email, webhook, etc.)
5. **Generate** — produce response with confidence score
6. **Guardrails** — safety checks before sending
7. **Handoff** — escalate if confidence is low or user requests human

## Multi-tenancy

Every record is scoped by `organization_id`. No cross-tenant data access.

## Pluggable providers

```typescript
// LLM
createLlmProvider("openai" | "gemini", config)

// RAG
createRagProvider("pgvector" | "gemini_file_search", config)
```

## Database

- **PostgreSQL** (default) with **pgvector** for embeddings
- **MySQL** supported for relational app data; use Gemini File Search or a Postgres sidecar for vectors

## Realtime (Phase 10)

Socket.io for live chat, typing indicators, and human takeover events.
