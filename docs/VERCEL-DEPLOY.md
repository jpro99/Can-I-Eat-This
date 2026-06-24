# Deploy to Vercel

Caveman requires a **PostgreSQL** database on Vercel (SQLite does not work in serverless).

## 1. Create a free database (Neon — recommended)

1. Go to [https://neon.tech](https://neon.tech) and sign up
2. Create a project → copy the **connection string** (starts with `postgresql://`)
3. Use the **pooled** connection string if Neon offers one (better for serverless)

## 2. Add Vercel environment variables

In Vercel → your project → **Settings → Environment Variables**, add:

| Name | Value |
|------|--------|
| `DATABASE_URL` | Your Neon PostgreSQL connection string |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` |

Apply to **Production**, **Preview**, and **Development**.

## 3. Redeploy

Push to GitHub or click **Redeploy** in Vercel.

The build runs `prisma db push` automatically to create tables on first deploy.

## 4. Seed restaurant data (optional, one time)

From your machine with `DATABASE_URL` set to the same Neon URL:

```bash
npm run db:seed
```

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Environment variable not found: DATABASE_URL` | Add `DATABASE_URL` in Vercel env vars |
| Build fails on Prisma | Ensure connection string uses `?sslmode=require` |
| App loads but API 500 | Check Vercel **Functions** logs; verify DB is reachable |

## Install on phone

After deploy, open your Vercel HTTPS URL in Safari → **Share → Add to Home Screen**.
