import type { VercelRequest, VercelResponse } from '@vercel/node';
import { collection, query, where, getDocs, getDoc, doc, addDoc } from 'firebase/firestore';
import crypto from 'crypto';
import { db, sendMailWithLogging } from './_lib/resendHelper';
import { getInviteStaffTemplate } from '../src/services/email/emailTemplates';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { fullName, email, phone, role, department, tenantId, createdBy } = req.body;

  if (!fullName || !email || !role || !tenantId) {
    return res.status(400).json({ error: 'Missing required arguments: fullName, email, role, and tenantId.' });
  }

  try {
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Check duplicate pending invite in Firestore employees collection
    const checkQ = query(
      collection(db, 'employees'),
      where('email', '==', trimmedEmail),
      where('tenantId', '==', tenantId)
    );
    const checkSnap = await getDocs(checkQ);
    if (!checkSnap.empty) {
      return res.status(400).json({ error: `An invitation/employee with email ${trimmedEmail} already exists.` });
    }

    // 2. Fetch Restaurant Name for the email template branding
    let restaurantName = 'RestaurantOS Partner';
    try {
      const restDocRef = doc(db, 'restaurants', tenantId);
      const restDocSnap = await getDoc(restDocRef);
      if (restDocSnap.exists()) {
        const restData = restDocSnap.data();
        if (restData && restData.name) {
          restaurantName = restData.name;
        }
      }
    } catch (e) {
      console.warn('[Vercel API] Failed to fetch restaurant name:', e);
    }

    const secureToken = crypto.randomBytes(32).toString('hex');
    const now = new Date().toISOString();

    // 3. Store invitation status in Firestore
    const employeeRef = await addDoc(collection(db, 'employees'), {
      fullName: fullName.trim(),
      email: trimmedEmail,
      phone: (phone || '').trim(),
      role: role,
      department: (department || '').trim(),
      tenantId: tenantId,
      branchId: '',
      status: 'pending',
      activationStatus: 'invited',
      firebaseUid: null,
      invitedAt: now,
      createdBy: createdBy || 'system',
      updatedAt: now,
      invitationToken: secureToken,
    });

    // 4. Send invitation email using Resend
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost:3000';
    const activationLink = `${protocol}://${host}/staff/activate?token=${secureToken}&email=${encodeURIComponent(trimmedEmail)}`;

    const templateHtml = getInviteStaffTemplate({
      fullName: fullName,
      restaurantName: restaurantName,
      role: role,
      department: department || (role === 'kitchen' ? 'Kitchen' : 'Service'),
      activationLink: activationLink,
    });

    const emailRes = await sendMailWithLogging({
      to: trimmedEmail,
      subject: `Join ${restaurantName} on RestaurantOS`,
      html: templateHtml,
      tenantId: tenantId,
      type: 'staff_invitation',
    });

    return res.status(200).json({ 
      success: true, 
      employeeId: employeeRef.id, 
      emailSent: emailRes.success,
      emailError: emailRes.error || undefined,
      activationLink
    });
  } catch (err: any) {
    console.error('[Vercel API] send-staff-invitation error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
