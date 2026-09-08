import { getBaseTemplate } from './BaseTemplate';

export interface InviteStaffData {
  fullName: string;
  role: string;
  department: string;
  activationLink: string;
}

export const getInviteStaffTemplate = (data: InviteStaffData): string => {
  const bodyContent = `
    <p>Hello ${data.fullName},</p>
    <p>You have been invited to join the restaurant team on <strong>RestaurantOS</strong> as a <strong>${data.role}</strong> in the <strong>${data.department}</strong> department.</p>
    <p>Click the button below to activate your staff account and set up your secure password.</p>
    <div class="btn-container">
      <a href="${data.activationLink}" class="btn">Activate Account</a>
    </div>
    <p>If you did not expect this invitation, you can safely ignore this email.</p>
  `;
  return getBaseTemplate('Join the team', bodyContent);
};
