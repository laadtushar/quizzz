# Email Setup Guide

This application uses Gmail SMTP with App Password for sending emails.

## Environment Variables Required

Add these to your `.env` file:

```env
# Gmail Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password

# App URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Development
# NEXT_PUBLIC_APP_URL=https://your-app.vercel.app  # Production
```

## Setting Up Gmail App Password

1. **Enable 2-Step Verification** on your Google Account:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification if not already enabled

2. **Generate App Password**:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Enter a name like "Appsatile Quizzz"
   - Click "Generate"
   - Copy the 16-character password (spaces don't matter)

3. **Add to Environment Variables**:
   - Add `GMAIL_APP_PASSWORD` to your `.env` file
   - Add `GMAIL_USER` with your Gmail address

## Features Implemented

### 1. Email Verification
- New users receive a verification email upon registration
- Email contains a secure verification link
- Token expires after 24 hours
- Verification page at `/auth/verify-email`

### 2. Assignment Reminders
- Automated email reminders for assignments due within 24 hours
- Sent via cron job (daily at 9:00 AM UTC)
- Includes quiz title, due date, and direct link to quiz

## Email Templates

Email templates are located in `lib/email/templates.ts`:
- **Verification Email**: Welcome message with verification link
- **Assignment Reminder**: Quiz reminder with due date and link

## Testing

To test email functionality:

1. **Verify Configuration**:
   ```typescript
   import { verifyEmailConfig } from '@/lib/email/config'
   await verifyEmailConfig() // Should log "Email server is ready"
   ```

2. **Test Registration**:
   - Register a new user
   - Check email inbox for verification email
   - Click verification link

3. **Test Assignment Reminders**:
   - Create an assignment with due date within 24 hours
   - Wait for cron job to run (or trigger manually)
   - Check user's email for reminder

## Troubleshooting

### Emails Not Sending

1. **Check Environment Variables**:
   - Ensure `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set
   - Verify app password is correct (16 characters)

2. **Check Gmail Settings**:
   - Ensure "Less secure app access" is not required (App Passwords bypass this)
   - Verify 2-Step Verification is enabled

3. **Check Logs**:
   - Look for email errors in server logs
   - Check console for "Email configuration error" messages

### Common Errors

- **"Invalid login"**: App password is incorrect
- **"Connection timeout"**: Network/firewall issue
- **"Rate limit exceeded"**: Too many emails sent (Gmail limit: 500/day for free accounts)

## Production Considerations

1. **Rate Limits**: Gmail free accounts have a 500 emails/day limit
2. **Alternative Services**: For higher volume, consider:
   - SendGrid
   - AWS SES
   - Resend
   - Mailgun

3. **Email Deliverability**: 
   - Use a custom domain for better deliverability
   - Set up SPF/DKIM records
   - Monitor bounce rates

## Files Created/Modified

- `lib/email/config.ts` - Email transporter configuration
- `lib/email/templates.ts` - Email templates
- `lib/email/sender.ts` - Email sending functions
- `lib/auth/email-verification.ts` - Verification token utilities
- `app/api/auth/register/route.ts` - Updated to send verification email
- `app/api/auth/verify-email/route.ts` - Email verification endpoint
- `app/(auth)/verify-email/page.tsx` - Verification UI page
- `app/api/cron/send-assignment-reminders/route.ts` - Updated to send emails
- `prisma/schema.prisma` - Added email verification fields

