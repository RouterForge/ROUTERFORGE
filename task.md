You are a senior product engineer, full-stack architect, UI/UX designer, and SaaS founder assistant.

Your task is to build a complete, production-ready multilingual SaaS website called “RouterForge” (or “RouterLab” if the final brand naming needs improvement). This is not a landing page only. Build the full product: public site, authenticated dashboard, API playground, chat app, admin portal, billing pages, policy pages, blog shell, and all necessary infrastructure hooks.

PRIMARY GOAL
Create a polished SaaS platform for a multi-model AI API subscription service. The platform must feel like a real premium product, not a temporary proxy or a side project. The UX should communicate reliability, scale, trust, and simplicity.

BACKEND / CORE INTEGRATION
Use CLIProxyAPI Plus as the backend layer and integrate through its compatible AI model APIs and management capabilities. Treat it as the central router/proxy for models, accounts, and provider access.
Design the app so it can work with provider families such as:
- OpenAI / GPT / Codex
- Gemini
- Claude
- Open source models
- Future providers via a modular adapter layer

If a feature is unavailable from the backend directly, create a clean abstraction layer and placeholders so the product can still be built and extended later without breaking the architecture.

IMPORTANT PRODUCT POSITIONING
This is a subscription-based SaaS with time-based access plans.
The product is marketed as:
- easy to use
- multi-language
- multi-model
- developer-friendly
- premium and trustworthy
- scalable for individual users, teams, and power users

Do NOT present the service as temporary, experimental, or cheap. Present it as a serious platform with clear value and a strong brand.

LANGUAGES
The site must be fully multilingual with language switcher and locale routing.
Support these languages:
- English
- French
- German
- Spanish
- Portuguese
- Russian
- Vietnamese
- Chinese (Simplified)
- Hindi
- Bengali
- Malay
- Japanese
- Korean
- Arabic
- Hebrew
- Persian

Notes:
- Use proper i18n architecture.
- All static content must be translatable.
- User-generated content should remain in the user’s preferred language where possible.
- Locale detection should default to browser language but remain user overrideable.
- Ensure RTL support for Arabic, Hebrew, and Persian.
- Handle pluralization, numbers, dates, and currency correctly in each locale.

IMPORTANT FIXES / CLARIFICATIONS
- The language listed as “البرتقالية” should be treated as Portuguese.
- The language listed as “الهندسة” should be treated as Hindi.
- If you discover any ambiguous Arabic terms in the requirements, make sensible product-level corrections and note them in implementation comments.

PAGES TO BUILD

1) PUBLIC HOME / LANDING PAGE
Build a modern public homepage that explains the service clearly.
Sections:
- Hero section with concise value proposition
- Model families overview
- How it works
- Pricing preview
- Benefits for developers and users
- Trust / security / privacy section
- FAQ
- Call to action
- Footer with legal links, language switcher, social links, and support

The homepage should feel like a real SaaS brand homepage, not a generic template.

2) DASHBOARD (AUTHENTICATED USER AREA)
Create a user dashboard showing:
- current subscription status
- remaining subscription time
- current plan
- usage overview
- models used by hour, day, week, and month
- estimated cost if the user were using the official provider subscriptions
- request counts
- token counts
- average RPM / RPT / RPD
- model distribution charts
- recent activity feed
- alert cards for unusual usage
- account settings entry point

Dashboard should be visually rich, data-driven, and easy to understand.

Required widgets:
- usage summary cards
- line chart for requests over time
- bar chart for model usage
- token breakdown
- time remaining indicator
- activity table
- export CSV / JSON

3) PRICING PAGE
Build a pricing page where I can define all subscription prices.
Use the existing pricing structure as the starting point and improve the presentation.
Keep the model-family organization and duration-based billing concept.
Plans should include the following family structure:
- Open Source
- Gemini
- GPT / Codex
- Bundle
- Claude integrated where appropriate

Payment methods to support:
- Binance Pay
- Bybit Pay
- Debit / Credit Card via Polar.sh Gateway API
- Crypto payments

Pricing page requirements:
- monthly / weekly / daily / yearly options
- discounts for longer plans
- “best value” highlights
- compare plans table
- clear CTA buttons
- high conversion design
- localized prices and billing labels

4) PLAYGROUND PAGE
Create an API playground similar to OpenAI Platform.
Must include:
- model selector
- system prompt field
- user prompt field
- temperature / top_p / max tokens / streaming toggle
- response viewer
- code snippets for cURL, JavaScript, Python
- conversation history
- token estimate display
- copy buttons
- save / load presets
- model response comparison mode

The playground must make it easy for developers to test the API immediately.

5) NATURAL CHAT PAGE
Create a chat interface similar to chatgpt.com.
Use it for chat models.
Requirements:
- conversation sidebar
- new chat button
- message streaming UI
- markdown rendering
- code block rendering
- file attachment placeholder if supported later
- prompt suggestions
- model switcher
- conversation rename
- conversation delete
- search conversations
- conversation export
- responsive mobile layout

6) LEGAL / POLICY / INFO PAGES
Create these pages with professional content shells:
- Terms of Service
- Service Terms
- Refund Policy
- Privacy Policy
- About Us
- Blog
- Contact
- Security / Abuse Policy
- Acceptable Use Policy
- API docs landing page
- Status page shell

These pages should exist structurally even if some content is still placeholder text.

7) BLOG SYSTEM
Create a blog shell that supports:
- blog index
- categories
- tags
- post detail pages
- featured article section
- SEO meta tags
- multilingual article support

8) ADMIN PORTAL
Create a dedicated Admin section with separate login and permissions.
Only Super Admin can create Admin accounts.
Admin accounts must be individually controlled and audited.

Admin dashboard must include:
- total users
- active subscriptions
- revenue overview
- requests overview
- token usage overview
- top used models
- average RPM / RPT / RPD
- abuse detection signals
- suspicious users list
- provider usage summary
- system health
- logs and audit trail
- API key activity
- generated activation codes
- manual payment approvals
- support tickets / flagged accounts
- search users by email, id, key, subscription, usage

Admin analytics should show:
- per-user total consumption
- per-user average RPM / RPT / RPD
- request frequency by time range
- model choices
- input tokens and output tokens
- peak usage hours
- failed requests
- rate anomalies
- replayable audit events
- full conversation logs for abuse review, with strict access control

Keys / licenses tools:
- generate activation keys for subscriptions and giveaways
- create manual payment activation codes
- track issuance, redemption, expiry, and admin owner
- export keys as CSV / JSON

IMPORTANT SECURITY NOTE
Even though the product may display usage logs, conversation logs, or abuse monitoring for admin operations, implement strict role-based access, audit logs, encryption, and permission checks. Do not expose sensitive logs to unauthorized users.

ADMIN THEME REQUIREMENT
The Admin Dashboard should reuse the same design language as the main app, but with an admin-optimized theme:
- darker / more technical feel
- clearer dense data visualization
- stronger status indicators
- tables first, charts second
- bulk actions
- fast filtering
- searchable datasets
- dangerous actions require confirmation

DESIGN SYSTEM
Use a premium modern SaaS design system:
- dark-first UI with optional light mode
- clean typography
- strong spacing
- rounded cards
- subtle gradients
- polished shadows
- excellent mobile responsiveness
- clear hierarchy
- accessible contrast
- elegant micro-interactions
- smooth page transitions
- skeleton loaders
- toast notifications
- empty states
- error states
- loading states

The product should feel like a serious platform similar in polish to modern AI tools, not a cheap dashboard clone.

INFORMATION ARCHITECTURE
Use this structure:
- Public pages
- Auth pages
- User dashboard
- Playground
- Chat
- Billing
- Account settings
- Admin portal
- Docs
- Blog
- Legal pages

AUTHENTICATION / ACCOUNTS
Implement:
- sign up
- sign in
- sign out
- forgot password
- reset password
- email verification placeholder
- optional 2FA placeholder
- profile settings
- language preference
- notification preferences
- security settings
- API key management

SUBSCRIPTION MANAGEMENT
Implement:
- plans with start and end dates
- subscription status
- active / expired / paused / cancelled states
- time remaining
- renewal reminders
- plan upgrades / downgrades
- manual activation from admin
- giveaway key redemption
- payment status tracking

USAGE TRACKING
Track and display:
- request count
- token input count
- token output count
- total tokens
- model used
- endpoint used
- timestamp
- latency
- success / failure
- user ID
- API key ID
- subscription ID

Add analytics grouped by:
- hourly
- daily
- weekly
- monthly

API DESIGN
Build clean API endpoints for:
- auth
- users
- subscriptions
- plans
- usage
- models
- playground
- chat
- payments
- keys
- admin analytics
- logs
- blog content
- settings

Where possible, make the frontend consume a typed service layer rather than calling backend endpoints directly from UI components.

DATA MODEL
Design database tables / collections for:
- users
- roles
- plans
- subscriptions
- payments
- payment providers
- API keys
- activation codes
- usage events
- conversations
- messages
- models
- providers
- admin audit logs
- blog posts
- settings
- locale preferences
- abuse flags
- support tickets

NON-FUNCTIONAL REQUIREMENTS
- scalable architecture
- modular codebase
- clean folder structure
- production-friendly
- SSR / SEO where useful
- accessibility
- performance
- caching
- server-side logging
- error boundaries
- security best practices
- rate-limit protection on public endpoints
- admin-only audit logs
- environment variable support
- clean deployment story

SEO REQUIREMENTS
- multilingual SEO
- hreflang tags
- meta titles and descriptions per locale
- Open Graph tags
- Twitter card tags
- canonical URLs
- structured data where useful

COPYWRITING TONE
The brand voice should be:
- confident
- technical
- premium
- transparent
- developer-friendly
- international

Do not use exaggerated claims that are not supported by the product.
The website should communicate that this is a real subscription platform with multi-model access, not a temporary shortcut.

IMPLEMENTATION STACK PREFERENCE
Use a modern stack appropriate for a production SaaS:
- Next.js or equivalent React framework
- TypeScript
- Tailwind CSS
- component library / shadcn-style UI
- charts library
- i18n framework
- form validation
- auth system
- database ORM
- role-based access control
- server actions or API routes
- robust deployment configuration

If you need to choose specific libraries, choose the most production-ready and widely adopted ones.

BUILD OUTPUT
Deliver:
1. Full source code
2. Clear project structure
3. Working routes/pages
4. Reusable components
5. Localization setup
6. Admin portal
7. Dashboard analytics
8. Playground and chat UI
9. Pricing and billing UI
10. Legal page shells
11. Blog shell
12. API service layer
13. Database schema
14. Environment variable example
15. Setup instructions

QUALITY BAR
- No placeholder-only product shell unless explicitly stated
- No broken navigation
- No inaccessible controls
- No cramped layouts
- No toy-like UI
- No obvious demo-only shortcuts in core flows

SPECIAL PRODUCT GUIDANCE
- Include Claude as a first-class model family in the appropriate plan(s)
- Keep the existing family-based pricing logic and duration-based subscription logic
- Improve the layout for conversion and clarity
- Add smart routing suggestions such as “Fastest”, “Best Reasoning”, and “Best Value”
- Add a comparison matrix for plan features
- Add abuse detection signals in admin
- Add audit logging everywhere important
- Add a clear status / trust section to the public site
- Add FAQ entries about billing, model access, privacy, and support
- Add a prominent API key section for developers
- Add localization switcher everywhere appropriate
- Add RTL support for Arabic, Hebrew, and Persian
- Add modular provider adapters so more models can be added later

FINAL INSTRUCTION
Build the entire product as if it were going to be launched publicly. Make it visually impressive, maintainable, and extensible. Prioritize clarity, trust, speed, and a polished premium user experience.