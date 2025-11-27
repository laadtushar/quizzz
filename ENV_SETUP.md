# Environment Variables Setup Guide

Create a `.env.local` file in the root directory with the following variables:

```env
# Database Configuration
# Get this from your Supabase project settings > Database > Connection string
# Format: postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres
DATABASE_URL="postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres"

# Session Security
# Generate a secure random string: openssl rand -base64 32
SESSION_SECRET="your-long-random-secret-key-here-change-in-production-min-32-chars"

# Application URLs
# Development: http://localhost:3000
# Production: https://your-domain.vercel.app
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email Domain Restriction
# Only users with this email domain can register
NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN="@alsoit.com"

# Google AI (Gemini) Configuration
# Get your API key from: https://aistudio.google.com/app/apikey
GOOGLE_AI_API_KEY="your-google-ai-api-key-here"

# Cron Job Security
# Generate a secure random string for cron job authentication
# Used to secure cron endpoints from unauthorized access
CRON_SECRET="your-cron-secret-key-here-generate-with-openssl-rand-base64-32"

# Optional Feature Flags
# Enable/disable badges feature (future enhancement)
NEXT_PUBLIC_ENABLE_BADGES="false"

# Maximum questions allowed per quiz
NEXT_PUBLIC_MAX_QUESTIONS_PER_QUIZ="50"

# Node Environment
# Development: development
# Production: production
NODE_ENV="development"
```

## How to Get Each Value

### DATABASE_URL
1. Go to your Supabase project dashboard
2. Navigate to Settings > Database
3. Find the "Connection string" section
4. Copy the URI connection string
5. Replace `[YOUR-PASSWORD]` with your database password

### SESSION_SECRET
Generate a secure random string:
```bash
openssl rand -base64 32
```

### GOOGLE_AI_API_KEY
1. Visit https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

### CRON_SECRET
Generate a secure random string (same as SESSION_SECRET):
```bash
openssl rand -base64 32
```

### NEXT_PUBLIC_APP_URL
- **Development**: `http://localhost:3000`
- **Production**: Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)

## Security Notes

- Never commit `.env.local` to version control
- Use different values for development and production
- Rotate secrets regularly in production
- Keep your API keys secure and never share them

