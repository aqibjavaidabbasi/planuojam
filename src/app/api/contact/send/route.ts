import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, country, phone, message } = await req.json();

    if (!firstName || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1) Persist to Strapi (public create permission required on contact-message)
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
      // continue; we still try to send email
    }

    // 2) Send email via Nodemailer from Next.js server route
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USERNAME;
    const pass = process.env.SMTP_PASSWORD;
    const from = process.env.SMTP_FROM_EMAIL;
    const to = process.env.CONTACT_TO_EMAIL || from;

    if (!host || !user || !pass || !from || !to) {
      return NextResponse.json({ error: 'Email not configured' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const subject = `New contact message from ${firstName} ${lastName || ''}`.trim();
    const html = `
      <h2>New Contact Message</h2>
      <p><strong>Name:</strong> ${firstName} ${lastName || ''}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Country:</strong> ${country || '-'}</p>
      <p><strong>Phone:</strong> ${phone || '-'}</p>
      <p><strong>Message:</strong></p>
      <p>${(message || '').replace(/\n/g, '<br/>')}</p>
    `;

    await transporter.sendMail({ from, to, subject, html, replyTo: email });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Contact send error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
