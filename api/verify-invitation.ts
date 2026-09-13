import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    success: true,
    message: 'Staff invitation verification is handled directly client-side via Firestore getDoc.',
    documentation: '/staff/activate?token=TOKEN&email=EMAIL&id=EMPLOYEE_ID'
  });
}
