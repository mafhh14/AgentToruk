# Troubleshooting

## Database

**Cannot connect to PostgreSQL**

```bash
docker compose ps
docker compose logs postgres
```

Ensure `DATABASE_URL` matches docker-compose credentials.

**pgvector extension missing**

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Run after first database creation.

## Development

**Port 3000 already in use**

```bash
# Windows
netstat -ano | findstr :3000

# Or run on another port
npm run dev -w @agenttoruk/web -- -p 3001
```

**Prisma client not generated**

```bash
npm run db:generate
```

## Widget

**Widget not appearing**

- Check `data-org` attribute is set
- Check browser console for errors
- Verify script URL is correct
- Ensure CORS allows your domain

**Theme not loading**

- Widget falls back to defaults if config API is unreachable
- Verify `NEXT_PUBLIC_APP_URL` and `/api/v1/widget/config` endpoint

## AI

**OpenAI/Gemini errors**

- Verify API key in `.env`
- Check provider matches agent config
- Review rate limits and billing

## Build / CI

**Turbo build fails**

```bash
npm run db:generate
npm run build
```

Ensure Prisma client is generated before building packages that depend on it.
