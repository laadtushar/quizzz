# Supabase Setup Guide

This guide will help you set up Supabase for the Appsatile Quizzz application.

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: `appsatile-quizzz` (or your preferred name)
   - **Database Password**: Generate a strong password (save it securely!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is sufficient for development

## Step 2: Get Database Connection String

1. In your Supabase project dashboard, go to **Settings** > **Database**
2. Scroll to **Connection string** section
3. Select **URI** tab
4. Copy the connection string (it will look like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your database password
6. Add `?pgbouncer=true` for connection pooling (recommended for Vercel):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true
   ```

## Step 3: Connection Pooling (Recommended for Vercel)

Supabase provides connection pooling to handle many concurrent connections efficiently. For Vercel deployments, use the **Transaction** pooler:

1. In Supabase dashboard, go to **Settings** > **Database**
2. Find **Connection Pooling** section
3. Use the **Transaction** mode connection string (port 6543)
4. This is optimized for serverless environments like Vercel

**For Development:**
- Use direct connection (port 5432) - better for Prisma migrations

**For Production (Vercel):**
- Use pooled connection (port 6543) - better for serverless functions

## Step 4: Run Database Migrations

1. Set your `DATABASE_URL` in `.env.local`:
   ```env
   DATABASE_URL="postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres"
   ```

2. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

3. Push schema to database:
   ```bash
   npx prisma db push
   ```

   Or create a migration:
   ```bash
   npx prisma migrate dev --name init
   ```

4. Verify in Supabase:
   - Go to **Table Editor** in Supabase dashboard
   - You should see all tables: `users`, `sessions`, `quizzes`, `questions`, `assignments`, `attempts`, `ai_generation_logs`

## Step 5: Set Up Row Level Security (Optional)

Supabase supports Row Level Security (RLS), but since we're using Prisma with custom auth, we handle security in our API routes. However, you can enable RLS as an additional layer:

1. In Supabase SQL Editor, you can add RLS policies
2. For now, our API-level security is sufficient

## Step 6: Environment Variables for Vercel

When deploying to Vercel, use the **pooled connection string**:

1. In Vercel dashboard, go to your project settings
2. Navigate to **Environment Variables**
3. Add `DATABASE_URL` with the pooled connection string:
   ```
   postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true
   ```

## Step 7: Enable SSL (Production)

Supabase requires SSL connections. Prisma automatically handles this, but ensure your connection string includes SSL parameters if needed:

```
postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true&sslmode=require
```

## Troubleshooting

### Connection Timeout
- Use connection pooling (port 6543) for Vercel
- Check your IP is not blocked in Supabase dashboard

### Migration Issues
- Use direct connection (port 5432) for migrations
- Ensure you have the correct database password

### Too Many Connections
- Always use connection pooling in production
- Prisma Client handles connection pooling automatically

## Useful Supabase Features

### Database Backups
- Supabase automatically backs up your database daily
- You can restore from backups in the dashboard

### Database Extensions
- Supabase supports PostgreSQL extensions
- Currently, we don't require any special extensions

### Real-time (Future)
- Supabase supports real-time subscriptions
- Could be used for live leaderboard updates (future enhancement)

## Next Steps

1. Complete the setup by following `ENV_SETUP.md`
2. Run the application locally to test
3. Deploy to Vercel following `docs/DEPLOYMENT.md`

