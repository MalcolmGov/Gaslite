<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/logo-dark.svg">
    <img height="60" alt="Moove Prompts" src="public/logo.svg">
  </picture>
</h1>

<p align="center">
  <strong>The Moove Digital prompt library</strong><br>
  <sub>Collect, organise, and share AI prompts for your team and clients. Works with ChatGPT, Claude, Gemini, and more.</sub>
</p>

---

## What is this?

**Moove Prompts** is a white-label build of [prompts.chat](https://github.com/f/prompts.chat) (formerly *Awesome ChatGPT Prompts*), rebranded for **Moove Digital**. It keeps the full upstream feature set:

- Browse, search, and filter a prompt library by category and tag
- Create text, structured (JSON/YAML), and media prompts, with variables you fill in inline
- Versioning with a change-request workflow (like pull requests for prompts)
- Private prompts, personal collections, voting, comments, and a leaderboard
- Admin dashboard for users, categories, tags, reports, and webhooks
- MCP server (`/api/mcp`) so Claude Code, Cursor, and other AI tools can pull prompts directly
- Optional AI-powered semantic search and prompt generation (OpenAI-compatible API key)

Upstream-only branding (achievements, sponsors, app-store banners, the "about prompts.chat" pages) is switched off through `useCloneBranding = true` in `prompts.config.ts`.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Prisma + PostgreSQL, NextAuth v5, next-intl.

## Getting started

**Requirements:** Node.js 24.x, npm, and a PostgreSQL database (local, [Neon](https://neon.com), Supabase, Railway, etc.).

```bash
cd moove-prompts
npm install

cp .env.example .env
# Edit .env: set DATABASE_URL, NEXTAUTH_URL and NEXTAUTH_SECRET (openssl rand -base64 32)

npm run db:migrate      # create the database schema
npm run db:seed         # optional: seeds categories, an admin user, and community prompts
npm run dev             # http://localhost:3000
```

The seed script imports the public-domain (CC0) prompt catalogue from prompts.chat so the library is not empty on day one. Skip it if you want to start with a clean slate.

### Production

```bash
npm run build
npm run start
```

Or with Docker (app + Postgres):

```bash
docker compose up -d --build
```

See [DOCKER.md](DOCKER.md) for the full container guide.

### Deploying to Vercel (current setup)

This app lives in the `moove-prompts/` folder of the Gaslite repository, so it has its own Vercel project (`moove-prompts`, Root Directory `moove-prompts`) separate from the Gaslite one. `vercel.json` pins the Next.js preset and runs `scripts/vercel-build.sh`, which applies pending Prisma migrations automatically whenever a real `DATABASE_URL` is configured and then runs the normal build.

The database is a PostgreSQL 17 service in the `moove-prompts` Railway project, exposed through a public TCP proxy so Vercel can reach it. Its connection string is the `DATABASE_PUBLIC_URL` variable on that Railway service.

Environment variables to set on the Vercel project (Production and Preview):

| Variable | Value |
|---|---|
| `DATABASE_URL` | Railway `DATABASE_PUBLIC_URL`, with `?sslmode=require` appended |
| `DIRECT_URL` | Optional. Only needed if the database sits behind a connection pooler; defaults to `DATABASE_URL` |
| `NEXTAUTH_URL` | The site URL, e.g. `https://moove-prompts.vercel.app` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | `true` |
| `CRON_SECRET` | any random string (protects `/api/cron/reset-credits`) |

After the first deploy with these set, seed the library once from your machine: put the same `DATABASE_URL` in `moove-prompts/.env` and run `npm run db:seed`.

## Branding and configuration

Everything brand-related lives in one file: [`prompts.config.ts`](prompts.config.ts).

| Setting | Where |
|---|---|
| Name, description, logo paths | `branding` |
| Primary colour, radius, density | `theme` (currently Moove teal `#0D9488`) |
| Sign-in providers, open registration | `auth` |
| Languages | `i18n` (17 locales available upstream, English enabled by default) |
| Feature toggles (AI search, MCP, comments...) | `features` |

Logo files to replace with the official Moove Digital artwork:

- `public/logo.svg` and `public/logo-dark.svg` (header and homepage watermark)
- `public/favicon/*` (browser and home-screen icons)
- `public/og.png` (social share image, 1200x630)

Any `PCHAT_*` environment variable (for example `PCHAT_NAME`, `PCHAT_COLOR`) overrides the config at runtime without a rebuild, which is handy for Docker deployments.

### Enabling Google or GitHub sign-in

1. Create an OAuth app and add `https://<your-domain>/api/auth/callback/google` (or `/github`) as the callback URL.
2. Put the client ID and secret in `.env` (`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`, or `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`).
3. Add `"google"` or `"github"` to `auth.providers` in `prompts.config.ts`.

### Error monitoring

Sentry is wired in but disabled until you set `NEXT_PUBLIC_SENTRY_DSN` (plus `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` for source-map uploads).

## Useful scripts

```bash
npm run dev          # dev server
npm run build        # production build (runs prisma generate)
npm run lint         # ESLint
npm test             # Vitest
npm run db:studio    # Prisma Studio
npm run db:resetadmin
```

## Credits and licence

Built on [prompts.chat](https://github.com/f/prompts.chat) by Fatih Kadir Akın and contributors.

- Source code is licensed under the [MIT License](LICENSE-MIT).
- Prompt content imported from prompts.chat is public domain under [CC0 1.0](LICENSE-CC0).

See [LICENSE](LICENSE) for details.
