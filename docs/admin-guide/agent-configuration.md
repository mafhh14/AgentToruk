# Agent configuration

Configure how your AI agent behaves and appears.

## Agent settings

| Setting | Description |
|---------|-------------|
| Agent name | Displayed in widget header |
| Personality | System prompt context |
| Tone | Friendly, professional, concise, etc. |
| Business description | What your company does |
| LLM provider | OpenAI or Gemini |
| Model | e.g. gpt-4o-mini, gemini-2.5-flash |
| RAG provider | pgvector or Gemini File Search |
| Confidence threshold | Below this → escalate or fallback |
| Fallback message | When agent cannot answer |
| Working hours | Offline message outside hours |

## Escalation rules

Configure when to hand off to humans:

- User clicks "Talk to a human"
- Confidence below threshold
- Angry sentiment detected
- High-risk actions (refunds, cancellations)

## Widget appearance

Customize the embeddable chat widget:

- Primary and background colors (light + dark)
- Font family and size
- Theme mode: light, dark, or auto
- Allow user theme toggle
- Border radius and position
- Welcome message

Changes apply via the widget config API when visitors load the chat.
