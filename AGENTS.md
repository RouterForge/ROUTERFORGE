# AGENTS.md — RouterForge

This file documents project-specific commands and conventions for AI agents and humans alike.

## Commands

```bash
pnpm install         # install all dependencies (uses pnpm; npm/yarn also work)
pnpm dev             # start the dev server on http://localhost:3000
pnpm build           # production build
pnpm start           # serve a production build
pnpm lint            # eslint
pnpm typecheck       # tsc --noEmit
pnpm db:push         # apply prisma/schema.prisma to local SQLite
pnpm db:generate     # regenerate the Prisma client
pnpm db:seed         # seed plans + bootstrap admin
```

After editing `prisma/schema.prisma`, run `pnpm db:push` then `pnpm db:generate`.

## Verification before considering changes done

1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm build` (catches Server/Client component issues that lint/typecheck miss)

For features that touch routes, also smoke-test the affected page in `pnpm dev`.

## Conventions

- **Routing**: All app routes live under `src/app/[locale]/...`. Use the `Link`, `useRouter`, and `usePathname` exports from `@/i18n/navigation` — never the raw `next/link` or `next/navigation` versions, or you'll lose locale prefixes.
- **i18n**: Server components must call `setRequestLocale(locale)` before any translation lookup. Use `getTranslations({locale, namespace})` on the server, `useTranslations(namespace)` in clients. New keys go under `messages/en.json`; locale files only contain overrides.
- **Server vs. client**: Components default to server. Add `'use client'` only when you need state, refs, browser APIs, or React context that requires the client. Charts (recharts), forms with `useState`, and dropdowns must be client.
- **Styling**: Use Tailwind utility classes plus the design tokens in `src/app/globals.css`. Reuse the primitives in `src/components/ui/*` rather than introducing parallel button/card variants.
- **Logical properties**: Prefer `ms-*`, `me-*`, `ps-*`, `pe-*`, `start`, `end` over `ml`/`mr`/`pl`/`pr`/`left`/`right` so RTL keeps working.
- **Auth**: Use `getSessionUser()` / `requireUser()` / `requireAdmin()` from `@/lib/auth`. The session is a HMAC-signed cookie; in production, swap to Auth.js while keeping the same shape.
- **DB**: Use the singleton `db` from `@/lib/db`. Do not instantiate `PrismaClient` elsewhere.
- **Providers**: All upstream model calls go through `routeFor(modelId)` from `@/lib/providers`. Adapters must implement `ProviderAdapter` (`src/lib/providers/types.ts`).
- **Money**: Use `formatCurrency` from `@/lib/utils` for any user-facing amount.
- **Dates/numbers**: Use `formatDate` and `formatNumber` from `@/lib/utils` so locale formatting is consistent.

## i18n notes

- The original brief listed two ambiguous Arabic terms. We treat **"البرتقالية"** as **Portuguese (pt)** and **"الهندسة"** as **Hindi (hi)**.
- RTL locales: `ar`, `he`, `fa`. The locale layout sets `dir="rtl"` and Tailwind logical properties take care of layout flips.

## Adding a new model

1. Add an entry to `MODELS` in `src/lib/models.ts` with capabilities, pricing, and routing scores.
2. If it's a new family (currently `openai | claude | gemini | oss`), update `MODEL_FAMILIES` and at least one plan in `src/lib/plans.ts`.
3. Translations: add to `messages/en.json` only; locales fall back automatically.

## Adding a new provider adapter

1. Create `src/lib/providers/<id>.ts` implementing `ProviderAdapter` from `./types`.
2. Register it in `src/lib/providers/index.ts` and update `routeFor(modelId)` if certain models should target it.
3. Existing UI consumes the adapter through `routeFor`; no other changes required.

## Avoid

- Introducing a second design system or component library.
- Calling provider APIs from React components — always go through API routes.
- Storing secrets in code or in localStorage.
