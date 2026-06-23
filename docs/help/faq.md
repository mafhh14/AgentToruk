# FAQ

## General

**What is AgentToruk?**
An open-source AI customer support platform with chat widget, RAG knowledge base, ticketing, and human handoff.

**Is it self-hostable?**
Yes. Run with Docker, PostgreSQL, and your own API keys.

## Chat widget

**How do I add the widget to my site?**
Copy the embed script from Dashboard → Settings.

**Can I customize colors and fonts?**
Yes. Configure in Dashboard → Agent → Widget appearance.

**Does the widget support dark mode?**
Yes. Set theme to light, dark, or auto (follows system preference).

## AI & knowledge

**Which AI models are supported?**
OpenAI (GPT-4o, GPT-4o-mini) and Google Gemini.

**Which databases are supported?**
PostgreSQL (recommended, with pgvector). MySQL for app data with Gemini File Search for RAG.

**Why isn't the agent answering from my PDF?**
Ensure the document status is "Indexed". Check Phase 7 RAG implementation is complete. Try re-indexing.

## Support workflow

**When should I escalate to a human?**
When confidence is low, the user is frustrated, or the issue requires approval (refunds, account changes).

**Can humans reply in the same chat?**
Yes. Human handoff keeps the full thread (Phase 10).
