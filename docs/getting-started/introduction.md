# Introduction

AgentToruk helps businesses solve customer issues in real time using an AI chat agent.

## Who is it for?

| Audience | Interface |
|----------|-----------|
| Website visitors | Embeddable chat widget |
| Support agents | Admin dashboard — conversations & tickets |
| Business admins | Admin dashboard — config, knowledge, analytics |
| Developers | REST API, webhooks, embed script |

## Core capabilities

1. **Understand** — detect intent, sentiment, and urgency
2. **Retrieve** — search knowledge base with citations
3. **Act** — create tickets, check orders, send notifications
4. **Escalate** — transfer to humans when needed
5. **Learn** — analytics on gaps and performance

## Architecture overview

```
Chat Widget  →  API  →  Agent Engine  →  LLM (OpenAI/Gemini)
                              ↓
                         RAG (pgvector/Gemini File Search)
                              ↓
                         PostgreSQL
```

See [architecture.md](../developer-guide/architecture.md) for details.
