# Appsatile Quizzz

AI-powered training and engagement platform built with Next.js 14, Supabase PostgreSQL, and Google Gemini.

## Features

- **AI-Powered Quiz Generation**: Generate quizzes from text using Google Gemini
- **Multiple Question Types**: MCQ, multiple-select, true/false, ordering, fill-in-the-blank
- **Quiz Management**: Create, edit, and publish quizzes with rich settings
- **Assignment System**: Assign quizzes to users with due dates and reminders
- **Gamification**: XP system, leaderboards, and user statistics
- **Role-Based Access**: Admin and guest roles with appropriate permissions
- **Secure Authentication**: Custom email/password auth with session management

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, ShadCN UI
- **Backend**: Next.js API Route Handlers (Node.js 20)
- **Database**: Supabase PostgreSQL with Prisma ORM
- **AI**: Google Gemini via Genkit
- **Hosting**: Vercel
- **Authentication**: Custom email/password with session management

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (Supabase recommended)
- Google AI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in the required variables (see `ENV_SETUP.md` for details):
   - `DATABASE_URL`: Your Supabase PostgreSQL connection string
     - **Development**: Direct connection (port 5432)
     - **Production**: Pooled connection (port 6543) - see `SUPABASE_SETUP.md`
   - `SESSION_SECRET`: Generate with `openssl rand -base64 32`
   - `GOOGLE_AI_API_KEY`: Your Google AI API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - `NEXT_PUBLIC_APP_URL`: Your app URL (e.g., http://localhost:3000)
   - `NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN`: Email domain restriction (e.g., @alsoit.com)
   - `CRON_SECRET`: Generate with `openssl rand -base64 32`

4. Set up Supabase database:
   - Follow the detailed guide in `SUPABASE_SETUP.md`
   - Run database migrations:
     ```bash
     npx prisma generate
     npx prisma db push
     ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
/app
  /(auth) - Authentication pages
  /(dashboard)
    /admin - Admin routes
    /guest - Guest routes
  /api - API routes
/components
  /ui - ShadCN UI components
  /features - Feature components
  /admin - Admin-specific components
  /quiz - Quiz-related components
/lib
  /auth - Authentication utilities
  /ai - AI integration
  /quiz - Quiz logic
  /gamification - XP/leaderboard
  /security - Security utilities
/prisma - Database schema
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Quizzes
- `GET /api/quizzes` - List quizzes (admin)
- `POST /api/quizzes` - Create quiz (admin)
- `GET /api/quizzes/:id` - Get quiz details
- `PATCH /api/quizzes/:id` - Update quiz (admin)
- `DELETE /api/quizzes/:id` - Delete quiz (admin)
- `GET /api/quizzes/visible` - Get visible quizzes
- `POST /api/quizzes/:id/attempts` - Start quiz attempt
- `POST /api/attempts/:id/submit` - Submit quiz attempt

### AI
- `POST /api/ai/generate-quiz` - Generate quiz using AI (admin)

### Assignments
- `GET /api/assignments` - List assignments (admin)
- `POST /api/assignments` - Create assignment (admin)
- `GET /api/assignments/my` - Get user's assignments

### Gamification
- `GET /api/leaderboard` - Get leaderboard
- `GET /api/users/me/stats` - Get user statistics

## Database Schema

The application uses Prisma with PostgreSQL. Key models:

- `User` - User accounts with roles and XP
- `Session` - User sessions
- `Quiz` - Quiz definitions
- `Question` - Quiz questions
- `Assignment` - Quiz assignments to users
- `Attempt` - Quiz attempt records
- `AIGenerationLog` - AI generation tracking

See `prisma/schema.prisma` for full schema.

## Deployment

### Quick Start

1. **Set up Supabase**: Follow `SUPABASE_SETUP.md`
2. **Deploy to Vercel**: Follow `VERCEL_SETUP.md`
3. **Configure Environment**: See `ENV_SETUP.md`

### Detailed Guides

- **Supabase Setup**: See `SUPABASE_SETUP.md` for database configuration
- **Vercel Deployment**: See `VERCEL_SETUP.md` for deployment steps
- **Environment Variables**: See `ENV_SETUP.md` for all required variables
- **Full Deployment Guide**: See `docs/DEPLOYMENT.md`

### Cron Jobs

The application uses Vercel Cron for scheduled tasks (configured in `vercel.json`):
- Daily at 09:00 UTC: Send assignment reminders
- Daily at 00:00 UTC: Update overdue assignments
- Daily at 03:00 UTC: Cleanup incomplete attempts

Cron jobs are automatically set up when you deploy to Vercel.

## Security

- HTTP-only secure cookies for sessions
- Password hashing with bcrypt
- Email domain validation
- Rate limiting on auth endpoints
- Input validation with Zod
- XSS protection

## License

Internal use only - alsoit.com

