import nodemailer from 'nodemailer'

// Gmail SMTP configuration using App Password
export const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password
  },
})

// Verify email configuration
export async function verifyEmailConfig() {
  try {
    await emailTransporter.verify()
    console.log('Email server is ready to send messages')
    return true
  } catch (error) {
    console.error('Email configuration error:', error)
    return false
  }
}

