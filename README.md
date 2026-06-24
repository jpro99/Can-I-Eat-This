# Caveman

Scan food. Know if you should eat it. Log automatically.

Production-grade mobile-first PWA built with Next.js 15, TypeScript, Prisma, and OpenAI.

## Quick start

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000 on your phone (same Wi‑Fi) or desktop.

## Install on iPhone (PWA)

1. Deploy or run dev server accessible from your phone
2. Open in **Safari**
3. Tap **Share** → **Add to Home Screen**
4. Launch from home screen for full-screen standalone mode

## Install on Android

1. Open in Chrome
2. Tap menu → **Install app** (or accept the install banner)

## API keys

| Key | Required | Purpose |
|-----|----------|---------|
| `OPENAI_API_KEY` | Recommended | Label parsing, plate AI, voice parsing |
| `DATABASE_URL` | Yes | SQLite local (`file:./dev.db`) or PostgreSQL in prod |

Without OpenAI, the app falls back to basic OCR parsing and demo estimates.

## Commands

```bash
npm run dev        # Development server
npm run build      # Production build
npm run start      # Production server
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run test       # Vitest (scoring engine)
npm run db:push    # Apply schema
npm run db:seed    # Seed common foods
```

## Deploy (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Set env vars: `DATABASE_URL` (Postgres), `OPENAI_API_KEY`, `NEXT_PUBLIC_APP_URL`
4. Change `prisma/schema.prisma` provider to `postgresql` for production
5. Run `npx prisma db push` against production DB

## Architecture

See `docs/ARCHITECTURE.md` for full product architecture, data model, scoring logic, and file tree.

## Screens

- Onboarding & profile setup
- Today dashboard
- Scan chooser (barcode, label, plate, voice, manual, repeat)
- Decision result & serving edit
- Meal & ingredient detail
- History & reports (PDF/CSV/print)
- Settings, goals, avoid list

## Disclaimer

Caveman provides nutrition guidance based on your settings. It is not medical advice.
