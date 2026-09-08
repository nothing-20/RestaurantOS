import { getBaseTemplate } from './BaseTemplate';

export interface WelcomeData {
  fullName: string;
  restaurantName?: string;
}

export const getWelcomeTemplate = (data: WelcomeData): string => {
  const bodyContent = `
    <p>Welcome to <strong>RestaurantOS</strong>, ${data.fullName}!</p>
    <p>We are thrilled to have you onboard. Your account has been successfully created.</p>
    ${data.restaurantName ? `<p>Your restaurant workspace <strong>${data.restaurantName}</strong> is ready for setup.</p>` : ''}
    <p>Log in to your dashboard to begin managing your menu, tables, staff, and live operations.</p>
  `;
  return getBaseTemplate('Welcome to RestaurantOS', bodyContent);
};
