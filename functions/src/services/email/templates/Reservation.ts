import { getBaseTemplate } from './BaseTemplate';

export interface ReservationData {
  customerName: string;
  restaurantName: string;
  date: string;
  time: string;
  partySize: number;
  tableNumber?: string | number;
}

export const getReservationTemplate = (data: ReservationData): string => {
  const bodyContent = `
    <p>Hello ${data.customerName},</p>
    <p>Your table reservation at <strong>${data.restaurantName}</strong> has been successfully confirmed!</p>
    <div style="background: #090d16; padding: 24px; border-radius: 16px; border: 1px solid #1e293b; margin: 24px 0;">
      <p style="margin: 0 0 10px; font-size: 14px;">📅 <strong>Date:</strong> ${data.date}</p>
      <p style="margin: 0 0 10px; font-size: 14px;">⏰ <strong>Time:</strong> ${data.time}</p>
      <p style="margin: 0 0 10px; font-size: 14px;">👥 <strong>Party Size:</strong> ${data.partySize} guests</p>
      ${data.tableNumber ? `<p style="margin: 0; font-size: 14px;">🪑 <strong>Table:</strong> Table ${data.tableNumber}</p>` : ''}
    </div>
    <p>We look forward to serving you!</p>
  `;
  return getBaseTemplate('Reservation Confirmed', bodyContent);
};
