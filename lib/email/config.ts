import nodemailer from 'nodemailer'

// Check if email credentials are configured
export function isEmailConfigured(): boolean {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
}

// Gmail SMTP configuration using App Password
// Only create transporter if credentials are available
export const emailTransporter = isEmailConfigured()
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER!,
        pass: process.env.GMAIL_APP_PASSWORD!,
      },
    })
  : null

// Verify email configuration
export async function verifyEmailConfig(): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.warn('Email not configured: GMAIL_USER and/or GMAIL_APP_PASSWORD not set')
    return false
  }

  if (!emailTransporter) {
    return false
  }

  try {
    await emailTransporter.verify()
    console.log('Email server is ready to send messages')
    return true
  } catch (error) {
    console.error('Email configuration error:', error)
    return false
  }
}

