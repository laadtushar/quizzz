import { emailTransporter } from './config'
import { getEmailVerificationTemplate, getAssignmentReminderTemplate, type EmailVerificationData, type AssignmentReminderData } from './templates'

export async function sendEmailVerification(data: EmailVerificationData): Promise<boolean> {
  try {
    const { email } = data
    const { subject, html, text } = getEmailVerificationTemplate(data)

    await emailTransporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject,
      html,
      text,
    })

    console.log(`Verification email sent to ${email}`)
    return true
  } catch (error) {
    console.error('Error sending verification email:', error)
    return false
  }
}

export async function sendAssignmentReminder(data: AssignmentReminderData): Promise<boolean> {
  try {
    const { email } = data
    const { subject, html, text } = getAssignmentReminderTemplate(data)

    await emailTransporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject,
      html,
      text,
    })

    console.log(`Assignment reminder sent to ${email}`)
    return true
  } catch (error) {
    console.error('Error sending assignment reminder:', error)
    return false
  }
}

