# Environment variables

Copy `.env.example` to `.env` and configure the following.

## Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for session encryption (Phase 2) |

## AI providers

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key for GPT models and embeddings |
| `GEMINI_API_KEY` | Google Gemini API key |
| `DEFAULT_LLM_PROVIDER` | `openai` or `gemini` |
| `DEFAULT_RAG_PROVIDER` | `pgvector` or `gemini_file_search` |

## Application

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_URL` | App URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | Public URL for widget API calls |
| `NODE_ENV` | `development` or `production` |

## Optional

| Variable | Description |
|----------|-------------|
| `VECTOR_DATABASE_URL` | Separate Postgres for vectors when main DB is MySQL |

## Per-organization overrides

LLM and RAG providers can be configured per organization in the admin panel under **Agent → Configuration**, overriding these defaults.
