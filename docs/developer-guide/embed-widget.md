# Embed the chat widget

Add AgentToruk to any website with a single script tag.

## Basic embed

```html
<script
  src="https://cdn.agenttoruk.com/widget.js"
  data-org="org_your_organization_id"
  async
></script>
```

## Local development

```html
<script
  src="http://localhost:5173/src/main.ts"
  data-org="org_demo"
  data-api-url="http://localhost:3000"
  type="module"
></script>
```

Or build the widget:

```bash
npm run build -w @agenttoruk/widget
```

Then serve `apps/widget/dist/widget.iife.js`.

## Optional attributes

| Attribute | Description |
|-----------|-------------|
| `data-org` | **Required.** Organization ID |
| `data-api-url` | API base URL (default: production) |
| `data-primary` | Override primary color |
| `data-theme` | `light`, `dark`, or `auto` |

## JavaScript API

```javascript
// Destroy widget programmatically
window.AgentToruk?.destroy();
```

## CORS

Ensure your API allows requests from the domain where the widget is embedded.
