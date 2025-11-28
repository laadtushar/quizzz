import { emailTransporter, isEmailConfigured } from './config'
import { getEmailVerificationTemplate, getAssignmentReminderTemplate, type EmailVerificationData, type AssignmentReminderData } from './templates'

export async function sendEmailVerification(data: EmailVerificationData): Promise<boolean> {
  if (!isEmailConfigured() || !emailTransporter) {
    console.warn('Email not configured. Skipping verification email to', data.email)
    console.warn('Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables')
    return false
  }

  try {
    const { email } = data
    const { subject, html, text } = getEmailVerificationTemplate(data)

    await emailTransporter.sendMail({
      from: process.env.GMAIL_USER!,
      to: email,
      subject,
      html,
      text,
    })

    console.log(`Verification email sent to ${email}`)
    return true
  } catch (error) {
    console.error('Error sending verification email:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      if (error.message.includes('credentials')) {
        console.error('Please verify GMAIL_USER and GMAIL_APP_PASSWORD are set correctly in your environment variables')
      }
    }
    return false
  }
}

export async function sendAssignmentReminder(data: AssignmentReminderData): Promise<boolean> {
  if (!isEmailConfigured() || !emailTransporter) {
    console.warn('Email not configured. Skipping assignment reminder to', data.email)
    return false
  }

  try {
    const { email } = data
    const { subject, html, text } = getAssignmentReminderTemplate(data)

    await emailTransporter.sendMail({
      from: process.env.GMAIL_USER!,
      to: email,
      subject,
      html,
      text,
    })

    console.log(`Assignment reminder sent to ${email}`)
    return true
  } catch (error) {
    console.error('Error sending assignment reminder:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      if (error.message.includes('credentials')) {
        console.error('Please verify GMAIL_USER and GMAIL_APP_PASSWORD are set correctly in your environment variables')
      }
    }
    return false
  }
}

