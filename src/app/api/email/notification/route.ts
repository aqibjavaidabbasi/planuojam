import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import BookingEmail from '@/emails/BookingEmail';
import MessageEmail from '@/emails/MessageEmail';
import SubscriptionEmail from '@/emails/SubscriptionEmail';
import InquiryEmail from '@/emails/InquiryEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, to, subject, data, locale } = body;

    if (!type || !to || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const from = process.env.SMTP_FROM_EMAIL || 'onboarding@resend.dev';

    if (!resendApiKey) {
      return NextResponse.json({ error: 'Email service unconfigured' }, { status: 500 });
    }

    let reactElement;

    switch (type) {
      case 'booking_provider':
        reactElement = BookingEmail({ 
          username: data.username, 
          listingTitle: data.listingTitle, 
          bookingDate: data.bookingDate,
          locale,
        });
        break;
      case 'message':
        reactElement = MessageEmail({ 
          senderName: data.senderName, 
          recipientName: data.recipientName, 
          messageSnippet: data.messageSnippet,
          locale,
        });
        break;
      case 'subscription':
        reactElement = SubscriptionEmail({ 
          username: data.username, 
          listingTitle: data.listingTitle,
          locale,
        });
        break;
      case 'inquiry':
        reactElement = InquiryEmail({
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: data.message,
          listingTitle: data.listingTitle,
          locale,
        });
        break;
      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    const result = await resend.emails.send({
      from: `Planuojam <${from}>`,
      to: [to],
      subject: subject || 'New Notification from Planuojam',
      react: reactElement,
    });

    if (result.error) {
      console.error('Resend error:', result.error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: result.data?.id });
  } catch (err) {
    console.error('Notification send error', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
