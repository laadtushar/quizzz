# Vercel Deployment Setup Guide

This guide covers deploying Appsatile Quizzz to Vercel with Supabase.

## Prerequisites

- GitHub repository with your code
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Supabase project set up (see `SUPABASE_SETUP.md`)

## Step 1: Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

## Step 2: Configure Build Settings

Vercel should auto-detect, but verify:

- **Framework Preset**: Next.js
- **Root Directory**: `./` (root)
- **Build Command**: `npm run build` (or `next build`)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install`

## Step 3: Environment Variables

Add all environment variables in Vercel dashboard:

### Required Variables

1. **DATABASE_URL**
   - Use Supabase **pooled connection** (port 6543)
   - Format: `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true`
   - Get from: Supabase Dashboard > Settings > Database > Connection Pooling > Transaction mode

2. **SESSION_SECRET**
   - Generate: `openssl rand -base64 32`
   - Use a different value for production than development

3. **GOOGLE_AI_API_KEY**
   - Get from: [Google AI Studio](https://aistudio.google.com/app/apikey)

4. **NEXT_PUBLIC_APP_URL**
   - Your Vercel deployment URL: `https://your-app.vercel.app`
   - Or custom domain if configured

5. **NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN**
   - Set to: `@alsoit.com`

6. **CRON_SECRET**
   - Generate: `openssl rand -base64 32`
   - Used to secure cron job endpoints

### Optional Variables (for email functionality)

7. **GMAIL_USER**
   - Your Gmail address (e.g., `your-email@gmail.com`)
   - Required for sending verification emails and assignment reminders

8. **GMAIL_APP_PASSWORD**
   - Gmail App Password (16 characters)
   - See `docs/EMAIL_SETUP.md` for detailed setup instructions
   - **Note**: If not set, email features will be disabled (non-critical)

### Other Optional Variables

- `NEXT_PUBLIC_ENABLE_BADGES`: `false`
- `NEXT_PUBLIC_MAX_QUESTIONS_PER_QUIZ`: `50`
- `NODE_ENV`: `production` (auto-set by Vercel)

## Step 4: Deploy

1. Click **"Deploy"** in Vercel
2. Wait for build to complete
3. Your app will be live at `https://your-app.vercel.app`

## Step 5: Set Up Cron Jobs

Cron jobs are configured in `vercel.json`. Vercel will automatically set them up:

1. **Send Assignment Reminders**: Daily at 9:00 AM UTC
2. **Update Overdue Assignments**: Daily at 12:00 AM UTC
3. **Cleanup Incomplete Attempts**: Daily at 3:00 AM UTC

### Verify Cron Jobs

1. Go to Vercel Dashboard > Your Project > Cron Jobs
2. Verify all three cron jobs are listed
3. Check logs after first execution

### Cron Job Authentication

Cron jobs are secured with `CRON_SECRET`. Vercel automatically adds this as a header:
- Header: `Authorization: Bearer ${CRON_SECRET}`

Your cron endpoints verify this in the code.

## Step 6: Database Migrations

After first deployment, run migrations:

1. **Option 1: Via Vercel CLI** (Recommended)
   ```bash
   npx vercel env pull .env.local
   npx prisma migrate deploy
   ```

2. **Option 2: Direct Connection**
   - Use direct connection (port 5432) from your local machine
   - Run: `npx prisma migrate deploy`

3. **Option 3: Supabase SQL Editor**
   - Copy migration SQL from `prisma/migrations/`
   - Run in Supabase SQL Editor

## Step 7: Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings** > **Domains**
2. Add your custom domain
3. Update `NEXT_PUBLIC_APP_URL` environment variable
4. Follow DNS configuration instructions

## Step 8: Environment-Specific Deployments

### Production
- Branch: `main` or `master`
- Auto-deploys on push
- Use production environment variables

### Preview
- All other branches
- Creates preview deployments
- Can use different environment variables

### Staging (Optional)
- Create a separate Vercel project
- Connect to staging Supabase project
- Use `staging` branch

## Monitoring & Logs

### View Logs
1. Go to Vercel Dashboard > Your Project
2. Click **"Deployments"** tab
3. Click on a deployment
4. View **"Functions"** logs

### Function Logs
- API routes show up as serverless functions
- Check logs for errors
- Monitor execution time

### Performance
- Vercel Analytics (if enabled)
- Check function execution times
- Monitor database query performance

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all dependencies in `package.json`
- Ensure Prisma generates correctly: `npx prisma generate`

### Database Connection Errors
- Verify `DATABASE_URL` uses pooled connection (port 6543)
- Check Supabase project is active
- Verify database password is correct
- Check Supabase IP allowlist (should allow all for serverless)

### Cron Jobs Not Running
- Verify cron jobs appear in Vercel dashboard
- Check `CRON_SECRET` is set correctly
- Review cron job logs
- Verify cron endpoints return 200 status

### Function Timeouts
- Default timeout is 10 seconds
- Increased to 60 seconds in `vercel.json`
- For AI generation, may need to increase further
- Consider using Vercel Pro for longer timeouts

## Performance Optimization

### Edge Functions (Future)
- Consider moving some API routes to Edge Runtime
- Faster cold starts
- Better for global distribution

### Caching
- Vercel automatically caches static assets
- Use React Query for API caching
- Consider Vercel KV for session storage (future)

### Database Connection Pooling
- Always use Supabase pooled connection (port 6543)
- Prisma handles connection pooling automatically
- Monitor connection count in Supabase dashboard

## Next Steps

1. Set up monitoring (Vercel Analytics, Sentry, etc.)
2. Configure custom domain
3. Set up staging environment
4. Enable Vercel Analytics for performance tracking
5. Review and optimize function execution times

