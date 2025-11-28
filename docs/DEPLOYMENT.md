# Deployment Guide

## Prerequisites

- Vercel account
- Supabase account
- Google AI API key

## Step 1: Set Up Supabase

1. Create a new Supabase project (see `SUPABASE_SETUP.md` for detailed instructions)
2. Get your database connection string
   - **For Development**: Use direct connection (port 5432)
   - **For Production (Vercel)**: Use pooled connection (port 6543) - see Supabase Connection Pooling
3. Run database migrations (see Step 4 below)

## Step 2: Set Up Vercel

1. Connect your GitHub repository to Vercel
2. Import the project
3. Configure build settings:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

## Step 3: Environment Variables

Add the following environment variables in Vercel:

### Required
- `DATABASE_URL`: Supabase PostgreSQL **pooled** connection string (port 6543)
  - Format: `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true`
  - Get this from Supabase Settings > Database > Connection Pooling > Transaction mode
- `SESSION_SECRET`: Generate with `openssl rand -base64 32`
- `GOOGLE_AI_API_KEY`: Your Google AI API key
- `NEXT_PUBLIC_APP_URL`: Your production URL (e.g., `https://your-app.vercel.app`)
- `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN`: `@alsoit.com`
- `CRON_SECRET`: Generate with `openssl rand -base64 32`

### Optional (for email functionality)
- `GMAIL_USER`: Your Gmail address for sending emails
- `GMAIL_APP_PASSWORD`: Gmail App Password (see `docs/EMAIL_SETUP.md` for setup)
  - **Note**: If not set, email verification and reminders will be skipped (non-critical)

### Optional
- `NEXT_PUBLIC_ENABLE_BADGES`: `false`
- `NEXT_PUBLIC_MAX_QUESTIONS_PER_QUIZ`: `50`

## Step 4: Database Migration

1. Run Prisma migrations:
   ```bash
   npx prisma migrate deploy
   ```

2. Or use Prisma Studio to verify schema:
   ```bash
   npx prisma studio
   ```

## Step 5: Deploy

1. Push to main branch (auto-deploys)
2. Or manually deploy from Vercel dashboard

## Step 6: Verify Cron Jobs

Cron jobs are configured in `vercel.json`. Verify they're running:
- Check Vercel Cron dashboard
- Monitor logs for cron executions

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- **For Vercel**: Use pooled connection (port 6543) not direct connection (port 5432)
- Check Supabase connection pooling settings
- Ensure SSL is enabled (add `?sslmode=require` if needed)
- Verify database password is correct
- Check Supabase project is active (not paused)

### Session Issues
- Verify `SESSION_SECRET` is set
- Check cookie settings match environment

### AI Generation Fails
- Verify `GOOGLE_AI_API_KEY` is valid
- Check API quota limits
- Review error logs

