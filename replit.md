# Truekea

Marketplace de artículos de segunda mano donde los usuarios publican, compran y negocian artículos entre vecinos, con chat integrado entre comprador y vendedor.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at /api)
- `pnpm --filter @workspace/truekea run dev` — run the frontend (port 19734, served at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `DEFAULT_OBJECT_STORAGE_BUCKET_ID`, `PUBLIC_OBJECT_SEARCH_PATHS`, `PRIVATE_OBJECT_DIR` — object storage
- Required env: `SESSION_SECRET` — session secret for Replit Auth

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS v4 + shadcn/ui + framer-motion
- API: Express 5 + Replit Auth (OIDC/PKCE)
- DB: PostgreSQL + Drizzle ORM
- File storage: Replit Object Storage (GCS-backed, presigned URLs)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/db/src/schema/` — Drizzle table definitions
  - `auth.ts` — users, sessions (Replit Auth)
  - `listings.ts` — listings, conversations, messages
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/truekea/src/` — React frontend
  - `pages/` — one file per route
  - `components/` — shared UI components
- `lib/replit-auth-web/` — `useAuth()` hook for browser auth
- `lib/object-storage-web/` — `ObjectUploader` and `useUpload()` for file uploads

## Architecture decisions

- Contract-first: OpenAPI spec defines all endpoints, Orval generates typed React Query hooks and Zod schemas
- Replit Auth (OIDC/PKCE) for authentication — no custom login forms
- Object storage for listing photos — presigned URL uploads go direct to GCS from the browser
- Theme: orange + gray + white (light) / orange + black + gray (dark) via next-themes
- All user-facing text in Spanish

## Product

- Browse marketplace: grid of listings with search, category filter, price filter, status filter
- Listing detail: photo gallery, price, condition, location, seller info
- Create/edit listings with photo uploads
- Status management: active → pending → sold
- Seller dashboard: manage own listings with quick status buttons
- Chat: conversations between buyer and seller per listing, polling every 3s

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Auth templates are in `.local/skills/replit-auth/templates/` — copy, don't modify in-place
- After any OpenAPI spec change: run codegen (`pnpm --filter @workspace/api-spec run codegen`) before touching route code
- Demo seed data uses placeholder photo paths that 404 — expected; real uploads work fine
- The `pnpm.overrides` in root `package.json` pins React to 19.1.0 to prevent Uppy from pulling a duplicate React

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `replit-auth` skill for auth setup details
- See the `object-storage` skill for file upload details
