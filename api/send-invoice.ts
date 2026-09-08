import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendMailWithLogging } from './_lib/resendHelper';
import { getInvoiceTemplate } from '../src/services/email/emailTemplates';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, customerName, invoiceId, items, subtotal, tax, total, tenantId } = req.body;

  if (!email || !customerName || !invoiceId || !items || !subtotal || !tax || !total) {
    return res.status(400).json({ error: 'Missing required invoice config details.' });
  }

  try {
    const templateHtml = getInvoiceTemplate({
      customerName,
      invoiceId,
      date: new Date().toLocaleDateString(),
      items,
      subtotal,
      tax,
      total,
    });

    const emailRes = await sendMailWithLogging({
      to: email.trim(),
      subject: `Your Invoice Receipt #${invoiceId}`,
      html: templateHtml,
      tenantId: tenantId,
      type: 'invoice_email',
    });

    if (!emailRes.success) {
      return res.status(500).json({ error: emailRes.error || 'Failed to dispatch invoice receipt email.' });
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('[Vercel API] send-invoice error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
