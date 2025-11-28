export interface EmailVerificationData {
  email: string
  displayName: string
  verificationLink: string
}

export interface AssignmentReminderData {
  email: string
  displayName: string
  quizTitle: string
  dueDate: Date | null
  assignmentLink: string
}

export function getEmailVerificationTemplate(data: EmailVerificationData): { subject: string; html: string; text: string } {
  const { displayName, verificationLink } = data

  const subject = 'Verify your Appsatile Quizzz account'

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
          <h1 style="color: #2563eb;">Welcome to Appsatile Quizzz!</h1>
          <p>Hi ${displayName},</p>
          <p>Thank you for signing up! Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666; font-size: 12px;">${verificationLink}</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      </body>
    </html>
  `

  const text = `
Welcome to Appsatile Quizzz!

Hi ${displayName},

Thank you for signing up! Please verify your email address to complete your registration.

Click this link to verify: ${verificationLink}

If you didn't create an account, you can safely ignore this email.
  `

  return { subject, html, text }
}

export function getAssignmentReminderTemplate(data: AssignmentReminderData): { subject: string; html: string; text: string } {
  const { displayName, quizTitle, dueDate, assignmentLink } = data

  const dueDateText = dueDate
    ? new Date(dueDate).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'No due date set'

  const subject = `Reminder: Complete "${quizTitle}" quiz`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quiz Reminder</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
          <h1 style="color: #2563eb;">Quiz Reminder</h1>
          <p>Hi ${displayName},</p>
          <p>This is a reminder that you have a quiz assignment:</p>
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #2563eb;">${quizTitle}</h2>
            <p><strong>Due Date:</strong> ${dueDateText}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${assignmentLink}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Take Quiz Now
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666; font-size: 12px;">${assignmentLink}</p>
        </div>
      </body>
    </html>
  `

  const text = `
Quiz Reminder

Hi ${displayName},

This is a reminder that you have a quiz assignment:

Quiz: ${quizTitle}
Due Date: ${dueDateText}

Click this link to take the quiz: ${assignmentLink}
  `

  return { subject, html, text }
}

