# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
