import { getBaseTemplate } from './BaseTemplate';

export interface InvoiceData {
  customerName: string;
  invoiceId: string;
  date: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  subtotal: string;
  tax: string;
  total: string;
}

export const getInvoiceTemplate = (data: InvoiceData): string => {
  let itemsHtml = '';
  data.items.forEach(item => {
    itemsHtml += `
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #cbd5e1;">${item.name} x${item.quantity}</td>
        <td style="padding: 8px 0; font-size: 14px; text-align: right; color: #cbd5e1;">${item.price}</td>
      </tr>
    `;
  });

  const bodyContent = `
    <p>Hello ${data.customerName},</p>
    <p>Thank you for dining with us! Here is your bill invoice for receipt <strong>#${data.invoiceId}</strong>.</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
      <thead>
        <tr style="border-bottom: 1px solid #1e293b;">
          <th style="text-align: left; padding-bottom: 10px; font-size: 12px; color: #64748b; text-transform: uppercase;">Item</th>
          <th style="text-align: right; padding-bottom: 10px; font-size: 12px; color: #64748b; text-transform: uppercase;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        <tr style="border-top: 1px solid #1e293b;">
          <td style="padding: 12px 0 6px; font-size: 14px; color: #64748b;">Subtotal</td>
          <td style="padding: 12px 0 6px; font-size: 14px; text-align: right; color: #cbd5e1;">${data.subtotal}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #64748b;">Tax</td>
          <td style="padding: 6px 0; font-size: 14px; text-align: right; color: #cbd5e1;">${data.tax}</td>
        </tr>
        <tr style="font-weight: 700; font-size: 16px;">
          <td style="padding: 10px 0; color: #f8fafc;">Total Paid</td>
          <td style="padding: 10px 0; text-align: right; color: #f59e0b;">${data.total}</td>
        </tr>
      </tbody>
    </table>
    
    <p>Sent on ${data.date}</p>
  `;
  return getBaseTemplate('Your Bill Invoice', bodyContent);
};
