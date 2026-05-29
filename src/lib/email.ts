/**
 * Server-side Email Utility
 * Supports Resend REST API and Amazon SES for sending transactional emails.
 */
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  from?: string
  text?: string
}

export async function sendEmail({
  to,
  subject,
  html,
  from,
  text,
}: EmailOptions) {
  const emailService = process.env.EMAIL_SERVICE?.toUpperCase() || 'RESEND'
  const defaultFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev'
  const finalFrom = from || defaultFrom
  const finalTo = Array.isArray(to) ? to : [to]
  const finalText = text || html.replace(/<[^>]*>?/gm, '')

  if (emailService === 'SES') {
    return sendWithSES(finalTo, subject, html, finalText, finalFrom)
  } else {
    return sendWithResend(finalTo, subject, html, finalText, finalFrom)
  }
}

async function sendWithSES(to: string[], subject: string, html: string, text: string, from: string) {
  try {
    const sesClient = new SESClient({ region: process.env.AWS_REGION })
    const command = new SendEmailCommand({
      Source: from,
      Destination: { ToAddresses: to },
      Message: {
        Subject: { Data: subject },
        Body: {
          Html: { Data: html },
          Text: { Data: text }
        }
      }
    })

    const data = await sesClient.send(command)
    return { success: true, data }
  } catch (error: any) {
    console.error('SES Email Error:', error)
    return { success: false, error: error.message || 'Failed to send email via SES' }
  }
}

async function sendWithResend(to: string[], subject: string, html: string, text: string, from: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY is not defined in environment variables')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        text,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      console.error('Resend API Error:', data)
      return { success: false, error: data.message || 'Failed to send email via Resend' }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('Email sending failed:', error)
    return {
      success: false,
      error: 'Internal server error during email sending',
    }
  }
}
