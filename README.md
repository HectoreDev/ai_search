# AI Search

A pnpm monorepo containing a React + Vite frontend and a Hono API deployed as a
Cloudflare Worker. The application searches residential floor plans by name,
stories, square footage, bedrooms, bathrooms, status, and available states.

## Requirements

- Node.js 22+
- pnpm 10+
- Ubuntu WSL or another Linux environment is recommended

Keep the project inside the Linux filesystem, such as `~/projects/ai_search`,
for better WSL performance. Do not share `node_modules` between Windows and WSL.

## Development

```bash
pnpm install
pnpm dev
```

- Frontend: http://localhost:5173
- Worker API: http://localhost:8787

Run each application separately when needed:

```bash
pnpm dev:web
pnpm dev:api
```

## Cloudflare D1

The Worker uses the same D1 database as `vu-ai` through the `kb_home_ia`
binding. It does not create tables or run migrations. Wrangler connects to the
remote database because the binding uses `remote = true`.

The data management module writes to the existing `plans` and `community_plan`
tables. A valid `communityUID` from the `communities` table is required.

## Streaming AI chat

The main search chat uses TanStack AI, Gemini, Server-Sent Events, and the AG-UI
protocol. Add your Gemini key to `apps/api/.env`:

```dotenv
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-3.1-flash-lite
```

For a deployed Worker, store the key as a Cloudflare secret:

```bash
pnpm --filter api exec wrangler secret put GEMINI_API_KEY
```

The LLM calls the `search_floor_plans` server tool. The tool queries D1 and
streams its text and search results to the frontend.

## API endpoints

- `GET /api/health`
- `GET /api/plans` — paginated floor-plan search
- `POST /api/plans` — create or update a floor plan
- `POST /api/plans/import` — import up to 500 floor plans
- `POST /api/chat` — TanStack AI streaming chat
- `POST /api/chat/parse` — non-streaming parser fallback

## Validation and deployment

```bash
pnpm typecheck
pnpm build
pnpm deploy:api
```

## Production hosting

### API on Cloudflare Workers

From the repository root, use the following Cloudflare build settings:

```text
Build command:  pnpm --filter api build
Deploy command: pnpm --filter api deploy
```

Add `GEMINI_API_KEY` as a Cloudflare secret. The D1 binding is defined in
`apps/api/wrangler.toml`.

### Frontend on Netlify

`netlify.toml` contains the build and SPA routing configuration. Add this
environment variable in the Netlify project settings:

```dotenv
VITE_API_URL=https://your-worker.workers.dev
```

The value must be the Cloudflare Worker origin without a trailing slash. Deploy
the API first, then use its final URL in Netlify.
