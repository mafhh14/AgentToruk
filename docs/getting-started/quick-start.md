# Quick start

Get AgentToruk running locally in under 10 minutes.

## Prerequisites

- **Node.js** 20 or later
- **Docker** Desktop (for PostgreSQL)
- **OpenAI API key** or **Gemini API key** (for AI features in later phases)

## Steps

### 1. Install dependencies

```bash
npm install
```

### 2. Start the database

```bash
docker compose up -d
```

This starts PostgreSQL 16 with the pgvector extension on port `5432`.

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```env
DATABASE_URL="postgresql://agenttoruk:agenttoruk@localhost:5432/agenttoruk?schema=public"
OPENAI_API_KEY="sk-..."
```

### 4. Initialize the database

```bash
npm run db:generate
npm run db:push
```

### 5. Start development servers

```bash
npm run dev
```

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Landing page |
| http://localhost:3000/dashboard | Admin panel |
| http://localhost:3000/api/health | Health check |

### 6. Build the chat widget (optional)

```bash
npm run build -w @agenttoruk/widget
```

Output: `apps/widget/dist/widget.iife.js`

## Next steps

- Configure your agent in **Dashboard → Agent**
- Upload knowledge documents in **Dashboard → Knowledge** (Phase 7)
- Copy embed code from **Dashboard → Settings**

## Troubleshooting

See [troubleshooting.md](../help/troubleshooting.md).
