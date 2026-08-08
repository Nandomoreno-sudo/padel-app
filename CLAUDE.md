# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start the dev server (Turbopack, per `next dev` defaults)
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — ESLint (flat config, `eslint-config-next` core-web-vitals + typescript rules)

There is no test runner configured in this repo yet.

## Architecture

Next.js App Router project (`next@16`, React 19, TypeScript, Tailwind CSS v4, Supabase).

- **Routing**: `src/app/` — App Router only, no `pages/` directory. `src/app/layout.tsx` is the root layout (Geist fonts via `next/font/google`); `src/app/globals.css` is the global stylesheet.
- **Path alias**: `@/*` resolves to `src/*` (see `tsconfig.json`).
- **Styling**: Tailwind v4, configured via CSS (`@import "tailwindcss"` + `@theme inline` in `globals.css`) rather than a `tailwind.config.ts` file — theme tokens (colors, fonts) are defined as CSS custom properties there, including dark-mode overrides via `prefers-color-scheme`.
- **Supabase**: two separate client factories under `src/lib/supabase/`, built on `@supabase/ssr` (never use `@supabase/supabase-js`'s `createClient` directly in app code):
  - `client.ts` — `createClient()` using `createBrowserClient`, for use in Client Components.
  - `server.ts` — `async createClient()` using `createServerClient`, for use in Server Components/Route Handlers/Server Actions. It wires `next/headers`' `cookies()` (async in this Next version) to Supabase's `getAll`/`setAll` cookie adapter; `setAll` is wrapped in a try/catch since Server Components can't write cookies (a middleware refreshing the session is expected to cover that case if one is added).
  - Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`.env.local`, gitignored).

No middleware, auth flow, or database schema/types exist yet — the two client factories are the only Supabase wiring in place so far.
