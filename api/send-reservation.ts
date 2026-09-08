import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendMailWithLogging } from './_lib/resendHelper';
import { getReservationTemplate } from '../src/services/email/emailTemplates';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, customerName, restaurantName, date, time, partySize, tableNumber, tenantId } = req.body;

  if (!email || !customerName || !restaurantName || !date || !time || !partySize) {
    return res.status(400).json({ error: 'Missing required reservation configuration details.' });
  }

  try {
    const templateHtml = getReservationTemplate({
      customerName,
      restaurantName,
      date,
      time,
      partySize,
      tableNumber,
    });

    const emailRes = await sendMailWithLogging({
      to: email.trim(),
      subject: 'Your Table Reservation is Confirmed!',
      html: templateHtml,
      tenantId: tenantId,
      type: 'reservation_confirmation',
    });

    if (!emailRes.success) {
      return res.status(500).json({ error: emailRes.error || 'Failed to dispatch reservation confirmation email.' });
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('[Vercel API] send-reservation error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
