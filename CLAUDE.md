# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pnpm install

# Dev server (http://localhost:3000/cadam)
pnpm dev

# Build
pnpm build

# Type check
pnpm typecheck

# Lint (frontend only)
pnpm lint

# Lint Supabase functions (requires Deno)
pnpm lint:supabase

# Format
pnpm format

# Start local Supabase (PostgreSQL + Auth + Storage + Edge Functions)
npx supabase start
npx supabase functions serve --no-verify-jwt

# Local webhook tunnel (required for FAL AI webhooks)
ngrok http 54321
```

No test suite exists.

## Environment Setup

Copy `.env.local.template` to `.env.local`:

```
VITE_SUPABASE_ANON_KEY="<local anon key from supabase start output>"
VITE_SUPABASE_URL="http://127.0.0.1:54321"
```

Supabase functions env (`supabase/functions/.env`):

```
ANTHROPIC_API_KEY=...
ENVIRONMENT=local
NGROK_URL=<ngrok tunnel URL>
FAL_KEY=...
OPENAI_API_KEY=...
GOOGLE_API_KEY=...
```

Google OAuth locally requires `GOOGLE_CLIENT_ID` and `GOOGLE_SECRET` in the shell environment before running `supabase start`, since `supabase/config.toml` reads them via `env(...)`.

## Architecture

### Two Conversation Modes

**Parametric** (`type: 'parametric'`): AI generates OpenSCAD code. The code runs in-browser via OpenSCAD WASM (`src/vendor/openscad-wasm/`). Users get interactive parameter sliders extracted from the generated code. The `parametric-chat` Edge Function handles code generation using Claude.

**Creative** (`type: 'creative'`): AI generates 3D meshes via a multi-stage pipeline:

1. Text → image (primary: gpt-image-2 via OpenAI Responses API; fallback chain: Gemini Multi-Turn → Flux via FAL)
2. Image → 3D mesh via FAL AI (model-dependent, see below)

### Mesh Generation Models

| Model     | Image gen                               | 3D gen                                                        |
| --------- | --------------------------------------- | ------------------------------------------------------------- |
| `fast`    | Flux (FAL)                              | Tripo v2.5 textureless                                        |
| `quality` | gpt-image-2 → Gemini → Flux             | SAM 3D (`fal-ai/sam-3/3d-objects`) with Moondream3 captioning |
| `ultra`   | Gemini Flash / Multi-Turn / gpt-image-2 | Meshy v6 Preview                                              |
| upscale   | (reuses seed image)                     | Hunyuan3D v3.1 Pro                                            |

Previews (quick GLB previews shown while high-quality mesh processes): always Hunyuan3D v2 Mini Turbo.

Multi-turn image editing uses gpt-image-2's `previous_response_id` mechanism — the `image_generation_call_id` stored on the `images` table row is the Responses API call ID. Fresh user uploads skip this and go through base64.

### Backend: Supabase Edge Functions (Deno)

Functions live in `supabase/functions/`. Shared utilities in `supabase/functions/_shared/`:

- `billingClient.ts` — token consumption/refund against external adam-billing service; local stub returns unlimited tokens
- `imageGen.ts` — all image generation helpers (gpt-image-2, Gemini variants, Flux)
- `sentry.ts` — error logging
- `supabaseClient.ts` — service-role client

Mesh generation is async: `mesh/index.ts` inserts a row, submits to FAL with a webhook URL, returns immediately. `fal-webhook/index.ts` receives the result and broadcasts via Supabase Realtime to `mesh-updates-{userId}` channel.

`ENVIRONMENT=local` + `NGROK_URL` causes functions to use the ngrok tunnel as the webhook base URL (FAL needs a public URL to call back).

### Frontend

**Router** (`src/main.tsx`): `basename='/cadam'`. All routes are under `/cadam`. Auth-protected routes wrapped in `AuthGuard`.

**Key contexts:**

- `AuthContext/AuthProvider` — session, user, billing stub, realtime mesh updates
- `ConversationContext` — current conversation + mutations
- `MeshFilesContext` — loaded GLB/FBX blob data for the 3D viewer

**State pattern**: TanStack Query for server state. React context for cross-component state. No Redux.

**3D viewer**: React Three Fiber + Three.js + Drei. OpenSCAD output (STL) is converted to GLB in a web worker (`src/worker/`).

### Shared Types

`shared/types.ts` and `shared/database.ts` are consumed by both the frontend (`@shared/` alias) and Supabase functions (via import map in `supabase/deno.json`). Changing these types requires verifying both sides compile.

### Token Billing

Every `mesh` call costs 30 tokens (`MESH_TOKEN_COST`). The billing client calls an external adam-billing service. Locally, `AuthProvider` returns a stub billing status with zero tokens — the `billingClient.ts` in Edge Functions is also stubbed for local to avoid billing errors.

### Routing Note

The Vite `base: '/cadam'` means `import.meta.env.BASE_URL` is `/cadam/`. All OAuth `redirectTo` values must include this base path so React Router's `basename` can match the post-auth URL.
