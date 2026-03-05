/**
 * Server-side Email Utility
 * Uses Resend REST API for sending transactional emails.
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, from, text }: EmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;
  const defaultFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  if (!apiKey) {
    console.error('RESEND_API_KEY is not defined in environment variables');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: from || defaultFrom,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text: text || html.replace(/<[^>]*>?/gm, ''), // Basic fallback text
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API Error:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: 'Internal server error during email sending' };
  }
}
