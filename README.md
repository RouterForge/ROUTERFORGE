# RouterForge

> One subscription. Every major AI model.

RouterForge is a production-ready, multilingual SaaS platform that gives developers and teams subscription-based access to OpenAI, Claude, Gemini, and curated open-source models through a single OpenAI-compatible gateway powered by [CLIProxyAPI Plus](https://github.com/router-for-me/CLIProxyAPI).

This repository contains:

- 🌍 Public marketing site (16 languages, full RTL support)
- 🔐 Auth flow (sign in, sign up, forgot/reset password)
- 📊 User dashboard with usage analytics
- 🧪 API playground (model selector, streaming, code snippets)
- 💬 Chat interface (sidebar, markdown, conversation export)
- 💳 Billing & subscriptions (Polar.sh, Binance Pay, Bybit Pay, crypto)
- 🛡️ Admin portal (users, payments, keys, audit logs, abuse signals)
- 📚 Blog shell, docs landing, status page, legal pages
- 🔌 Modular provider adapter layer (CLIProxyAPI today, more next)
- 🗃️ Full Prisma schema for users, subscriptions, usage, payments, audit, content

---

## Tech stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS + shadcn-style component primitives (Radix UI)
- **i18n**: `next-intl` with locale-prefixed routing and English fallback merging
- **Database**: Prisma + SQLite (dev) — swap to Postgres/MySQL for production
- **Charts**: Recharts
- **Auth**: cookie-based session helper (drop-in compatible with Auth.js)
- **AI gateway**: CLIProxyAPI Plus adapter with deterministic mock fallback
- **Payments**: Polar.sh, Binance Pay, Bybit Pay, on-chain crypto (webhook stubs)

---

## Quickstart

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example .env.local
# fill in CLIPROXY_BASE_URL, AUTH_SECRET, etc.

# 3. Initialize the database (SQLite by default)
pnpm db:push
pnpm db:seed

# 4. Run the dev server
pnpm dev
```

The app starts on http://localhost:3000. Locale-prefixed URLs are required, e.g. `/en`, `/fr`, `/ja`, `/ar`. The middleware redirects bare `/` to your preferred locale.

---

## Project structure

```
RouterForge/
├─ messages/                  # Locale message catalogs (en is base, others override)
├─ prisma/
│  ├─ schema.prisma           # Full data model
│  └─ seed.ts                 # Seed plans + bootstrap admin
├─ src/
│  ├─ app/
│  │  ├─ [locale]/
│  │  │  ├─ (marketing)/      # Public site (home, pricing, blog, legal, status…)
│  │  │  ├─ (auth)/           # Sign in / up / reset
│  │  │  ├─ (app)/            # Authenticated user app (dashboard, playground, chat…)
│  │  │  └─ (admin)/admin/    # Admin portal with darker theme
│  │  └─ api/                 # Auth, playground, chat, webhooks, OpenAI-compatible /v1
│  ├─ components/
│  │  ├─ ui/                  # shadcn-style primitives (button, dialog, select, …)
│  │  ├─ marketing/           # Header, footer, pricing view, legal page shell
│  │  ├─ app/                 # Sidebar, topbar, charts, stat cards, API keys
│  │  ├─ admin/               # Admin sidebar
│  │  ├─ playground/          # Playground UI
│  │  ├─ chat/                # Chat UI
│  │  └─ shared/              # Logo, locale switcher, theme toggle
│  ├─ i18n/                   # Routing + request config + locale list
│  └─ lib/                    # Models, plans, usage, providers, auth, db, utils
└─ tailwind.config.ts
```

---

## i18n

Sixteen locales ship out of the box:

| Code | Language | RTL |
| ---- | -------- | --- |
| en | English | |
| fr | French | |
| de | German | |
| es | Spanish | |
| pt | Portuguese (note) | |
| ru | Russian | |
| vi | Vietnamese | |
| zh | Chinese (Simplified) | |
| hi | Hindi (note) | |
| bn | Bengali | |
| ms | Malay | |
| ja | Japanese | |
| ko | Korean | |
| ar | Arabic | ✅ |
| he | Hebrew | ✅ |
| fa | Persian | ✅ |

> **Naming fixes from the original brief**: the entries originally written as "البرتقالية" and "الهندسة" were ambiguous; they are treated as Portuguese (`pt`) and Hindi (`hi`) respectively. RTL handling for `ar`, `he`, `fa` is wired through the `dir` attribute and Tailwind logical properties.

`messages/<locale>.json` files are sparse — keys missing in a locale fall back to English via `deepMerge` in `src/i18n/request.ts`. To translate more strings, simply add the key under the matching path in any locale file.

---

## Provider abstraction

Everything that talks to AI providers goes through `src/lib/providers/`. Today only the CLIProxyAPI Plus adapter is wired up (with a mock mode for local development), but the `ProviderAdapter` interface is provider-agnostic. To add a new provider:

1. Create `src/lib/providers/<provider>.ts` that implements `ProviderAdapter`.
2. Register it in `src/lib/providers/index.ts`.
3. Update `routeFor(modelId)` to point qualifying models at it.

The OpenAI-compatible endpoint at `/api/v1/chat/completions` already speaks the standard schema and supports streaming.

---

## Payments

Webhook handlers live in `src/app/api/webhooks/{polar,binance,bybit,crypto}/route.ts`. Each is a shell that you can fill in with provider-specific signature verification. Plan/Subscription updates should land in the corresponding Prisma rows.

---

## Admin portal

The admin portal is mounted at `/<locale>/admin`. It uses a darker zinc theme to clearly differentiate from the user app. Pages:

- `/admin` — overview with revenue, requests, suspicious users, provider health
- `/admin/users` — searchable user table with suspend action
- `/admin/subscriptions` — subscription rows with cycle / amount / status
- `/admin/payments` — payments with manual approval action
- `/admin/keys` — generate / list / export activation codes
- `/admin/providers` — provider health + traffic share
- `/admin/abuse` — abuse signals with severity / reason
- `/admin/logs` — append-only audit log
- `/admin/tickets` — support tickets
- `/admin/system` — system component status

Production must enforce `requireAdmin()` from `src/lib/auth.ts` in admin route handlers and add row-level checks to any sensitive analytics queries.

---

## Scripts

```bash
pnpm dev        # next dev
pnpm build      # next build
pnpm start      # next start
pnpm lint       # eslint
pnpm typecheck  # tsc --noEmit
pnpm db:push    # apply schema to local SQLite
pnpm db:seed    # seed plans + bootstrap admin
```

---

## Production checklist

- [ ] Replace SQLite with Postgres / MySQL (`prisma/schema.prisma`).
- [ ] Set `AUTH_SECRET` to a real 32+ char value.
- [ ] Configure `CLIPROXY_BASE_URL` and `CLIPROXY_ADMIN_TOKEN`.
- [ ] Configure payment provider keys + webhook secrets.
- [ ] Replace dev cookie session with Auth.js or your preferred auth provider.
- [ ] Add background worker for usage rollups (current dashboards use generators).
- [ ] Wire `/admin/*` routes to `requireAdmin()` server-side.
- [ ] Replace placeholder legal copy with reviewed legal text.

---

## License

Proprietary — © RouterForge. All rights reserved.
