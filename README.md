# TILKI OS

TILKI OS is a working full-stack MVP for small-business decision management. It combines a command center with specialized Marketing, Sales, Finance, Operations, Inventory, and Analytics agents.

## MVP capabilities

- Live business KPI dashboard
- Persistent AI recommendation queue
- Human approval and rejection workflow
- Task composer with automatic agent routing
- Durable activity history
- Integration readiness screen with explicit demo/live status
- Responsive Turkish interface

The current release uses a deterministic server-side agent playbook and demo business data. It does not claim to send messages, publish campaigns, place supplier orders, or modify external services.

## Stack

- React 19 + Next.js-compatible Vinext runtime
- TypeScript
- Cloudflare Worker deployment
- Cloudflare D1 persistence
- Drizzle schema and migrations
- Tailwind CSS and accessible UI primitives

## Development

```bash
npm ci
npm run db:generate
npm run build
npm test
npm run lint
```

## API

- `GET /api/dashboard`
- `POST /api/agent`
- `PATCH /api/recommendations/:id`

## Product safety

Every suggested action remains pending until a user explicitly approves or rejects it. External integrations are labelled as demo until real provider credentials and execution adapters are added.
