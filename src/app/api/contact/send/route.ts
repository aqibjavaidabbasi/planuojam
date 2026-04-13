import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import ContactEmail from '@/emails/ContactEmail';

const resend = new Resend(process.env.RESEND_API_KEY);
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, country, phone, message } = await req.json();

    if (!firstName || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1) Persist to Strapi
    try {
      const res = await fetch(`${API_URL}/api/contact-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { firstName, lastName, email, country, phone, message },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.warn('Strapi create contact-message failed', err);
      }
    } catch (e) {
      console.warn('Failed to persist contact-message to Strapi', e);
    }

    // 2) Send email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    const from = process.env.SMTP_FROM_EMAIL || 'onboarding@resend.dev';
    const to = process.env.CONTACT_TO_EMAIL || from;

    if (!resendApiKey) {
      console.error('RESEND_API_KEY is missing');
      return NextResponse.json({ error: 'Email service unconfigured' }, { status: 500 });
    }

    const { data, error } = await resend.emails.send({
      from: `Planuojam <${from}>`,
      to: [to],
      subject: `New contact message from ${firstName} ${lastName || ''}`.trim(),
      replyTo: email,
      react: ContactEmail({
        firstName,
        lastName,
        email,
        phone,
        country,
        message,
      }),
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error('Contact send error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
