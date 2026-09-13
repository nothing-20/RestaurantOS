import type { VercelRequest, VercelResponse } from '@vercel/node';
import { collection, query, where, getDocs, getDoc, doc, addDoc } from 'firebase/firestore';
import crypto from 'crypto';
import { db, sendMailWithLogging } from './_lib/resendHelper';
import { getInviteStaffTemplate } from '../src/services/email/emailTemplates';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { fullName, email, phone, role, department, tenantId, createdBy, activationLink: incomingLink, token: incomingToken, employeeId: incomingId } = req.body;

  if (!fullName || !email || !role || !tenantId) {
    return res.status(400).json({ error: 'Missing required arguments: fullName, email, role, and tenantId.' });
  }

  try {
    const trimmedEmail = email.trim().toLowerCase();

    // 1. Fetch Restaurant Name for the email template branding
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

    let finalActivationLink = incomingLink;
    let employeeId = incomingId;

    // If activationLink wasn't provided, handle creation server-side
    if (!finalActivationLink) {
      const secureToken = incomingToken || crypto.randomBytes(32).toString('hex');
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

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
        createdAt: now,
        expiresAt: expiresAt,
        createdBy: createdBy || 'system',
        updatedAt: now,
        invitationToken: secureToken,
      });

      employeeId = employeeRef.id;
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host || 'restaurant-os-dun.vercel.app';
      finalActivationLink = `${protocol}://${host}/staff/activate?token=${secureToken}&email=${encodeURIComponent(trimmedEmail)}&id=${employeeRef.id}`;
    }

    // 2. Send invitation email using Resend
    const templateHtml = getInviteStaffTemplate({
      fullName: fullName,
      restaurantName: restaurantName,
      role: role,
      department: department || (role === 'kitchen' ? 'Kitchen' : 'Service'),
      activationLink: finalActivationLink,
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
      employeeId: employeeId, 
      emailSent: emailRes.success,
      emailError: emailRes.error || undefined,
      activationLink: finalActivationLink
    });
  } catch (err: any) {
    console.error('[Vercel API] send-staff-invitation error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
