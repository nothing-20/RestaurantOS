import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendMailWithLogging } from './_lib/resendHelper';
import { getOrderConfirmationTemplate } from '../src/services/email/emailTemplates';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, customerName, orderNumber, restaurantName, total, tenantId } = req.body;

  if (!email || !customerName || !orderNumber || !restaurantName || !total) {
    return res.status(400).json({ error: 'Missing required order configuration details.' });
  }

  try {
    const templateHtml = getOrderConfirmationTemplate({
      customerName,
      orderNumber,
      restaurantName,
      date: new Date().toLocaleDateString(),
      total,
    });

    const emailRes = await sendMailWithLogging({
      to: email.trim(),
      subject: `Order Confirmation #${orderNumber}`,
      html: templateHtml,
      tenantId: tenantId,
      type: 'order_confirmation',
    });

    if (!emailRes.success) {
      return res.status(500).json({ error: emailRes.error || 'Failed to dispatch order confirmation email.' });
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('[Vercel API] send-order-confirmation error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
