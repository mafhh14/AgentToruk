# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a vulnerability

Please report security issues privately by emailing the maintainers (add your contact email when publishing the repo).

Do **not** open public GitHub issues for security vulnerabilities.

We aim to respond within 72 hours.

## Security practices

- API keys are stored hashed; never commit `.env` files
- All AI tool calls are audited
- Multi-tenant data is isolated by `organization_id`
- Dangerous actions require user confirmation
