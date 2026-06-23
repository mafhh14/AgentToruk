# Knowledge base

Upload company documents so the AI can answer with accurate, cited responses.

## Supported sources

| Type | Formats |
|------|---------|
| Files | PDF, DOCX, TXT |
| URLs | Web pages to crawl |

## RAG providers

### pgvector (self-hosted)

Documents are chunked, embedded with OpenAI, and stored in PostgreSQL with pgvector. Best for full control and self-hosting.

### Gemini File Search (managed)

Documents are uploaded to Google's File Search store. Google handles chunking, embedding, and retrieval. Best for fast setup.

## Best practices

1. **Keep documents focused** — one topic per file when possible
2. **Update regularly** — re-index after policy changes
3. **Use clear titles** — helps with source citations
4. **Remove outdated docs** — prevents stale answers

## Admin actions

- **Upload** — add new documents
- **Re-index** — refresh embeddings after edits
- **Delete** — remove outdated content
- **View status** — pending, processing, indexed, failed
