import { getBaseTemplate } from './BaseTemplate';

export interface OrderConfirmationData {
  customerName: string;
  orderNumber: string;
  restaurantName: string;
  date: string;
  total: string;
}

export const getOrderConfirmationTemplate = (data: OrderConfirmationData): string => {
  const bodyContent = `
    <p>Hello ${data.customerName},</p>
    <p>Your order at <strong>${data.restaurantName}</strong> has been successfully placed!</p>
    <div style="background: #090d16; padding: 24px; border-radius: 16px; border: 1px solid #1e293b; margin: 24px 0;">
      <p style="margin: 0 0 10px; font-size: 14px;">🏷️ <strong>Order ID:</strong> #${data.orderNumber}</p>
      <p style="margin: 0 0 10px; font-size: 14px;">📅 <strong>Date:</strong> ${data.date}</p>
      <p style="margin: 0; font-size: 14px;">💰 <strong>Total Amount:</strong> ${data.total}</p>
    </div>
    <p>We are preparing your items now and will notify you when they are ready.</p>
  `;
  return getBaseTemplate('Order Placed Successfully', bodyContent);
};
