import { getBaseTemplate } from './BaseTemplate';

export interface PasswordResetData {
  fullName: string;
  resetLink: string;
}

export const getPasswordResetTemplate = (data: PasswordResetData): string => {
  const bodyContent = `
    <p>Hello ${data.fullName},</p>
    <p>We received a request to reset your password for your <strong>RestaurantOS</strong> account.</p>
    <p>Click the button below to choose a new password. This link will expire shortly.</p>
    <div class="btn-container">
      <a href="${data.resetLink}" class="btn">Reset Password</a>
    </div>
    <p>If you did not request a password reset, you can safely ignore this email.</p>
  `;
  return getBaseTemplate('Reset Your Password', bodyContent);
};
