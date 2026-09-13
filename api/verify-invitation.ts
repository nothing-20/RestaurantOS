import type { VercelRequest, VercelResponse } from '@vercel/node';
import { collection, query, where, getDocs, getDoc, doc, limit } from 'firebase/firestore';
import { db } from './_lib/resendHelper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id, token, email } = req.body || {};

  if (!id && !token && !email) {
    return res.status(400).json({ error: 'At least one of id, token, or email is required.' });
  }

  try {
    let empDoc: any = null;
    let empData: any = null;

    // 1. Fetch by direct document ID if provided
    if (id) {
      const docRef = doc(db, 'employees', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        empDoc = snap;
        empData = snap.data();
      }
    }

    // 2. Fetch by token if document was not found by ID
    if (!empData && token) {
      const qToken = query(
        collection(db, 'employees'),
        where('invitationToken', '==', token),
        limit(1)
      );
      const snapToken = await getDocs(qToken);
      if (!snapToken.empty) {
        empDoc = snapToken.docs[0];
        empData = empDoc.data();
      }
    }

    // 3. Fallback fetch by email + activationStatus == 'invited'
    if (!empData && email) {
      const trimmedEmail = email.trim().toLowerCase();
      const qEmail = query(
        collection(db, 'employees'),
        where('email', '==', trimmedEmail),
        where('activationStatus', '==', 'invited'),
        limit(1)
      );
      const snapEmail = await getDocs(qEmail);
      if (!snapEmail.empty) {
        empDoc = snapEmail.docs[0];
        empData = empDoc.data();
      }
    }

    if (!empDoc || !empData) {
      return res.status(404).json({
        error: 'No pending invitation found. Please check your link or contact your restaurant manager.',
        code: 'NOT_FOUND',
      });
    }

    // 4. Validate status & activationStatus
    if (empData.activationStatus === 'activated' || empData.status === 'active') {
      return res.status(400).json({
        error: 'This invitation has already been activated.',
        code: 'ALREADY_ACTIVATED',
      });
    }

    if (empData.status !== 'pending' || empData.activationStatus !== 'invited') {
      return res.status(400).json({
        error: 'This invitation is no longer valid.',
        code: 'INVALID_STATUS',
      });
    }

    // 5. Expiration check
    if (empData.expiresAt && new Date(empData.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({
        error: 'This invitation has expired. Ask your restaurant owner to send a new invitation.',
        code: 'EXPIRED',
      });
    }

    // 6. Token validation if token was provided in the request
    if (token && empData.invitationToken && empData.invitationToken !== token) {
      return res.status(403).json({
        error: 'Invalid invitation token.',
        code: 'INVALID_TOKEN',
      });
    }

    // 7. Email validation if email was provided in the request
    if (email && empData.email && empData.email.trim().toLowerCase() !== email.trim().toLowerCase()) {
      return res.status(403).json({
        error: 'The provided email address does not match this invitation.',
        code: 'EMAIL_MISMATCH',
      });
    }

    // Fetch restaurant name for nice UI greeting
    let restaurantName = '';
    if (empData.tenantId) {
      try {
        const restSnap = await getDoc(doc(db, 'restaurants', empData.tenantId));
        if (restSnap.exists()) {
          restaurantName = restSnap.data()?.name || '';
        }
      } catch {
        // non-blocking
      }
    }

    return res.status(200).json({
      success: true,
      invitation: {
        id: empDoc.id,
        fullName: empData.fullName,
        email: empData.email,
        phone: empData.phone,
        role: empData.role,
        tenantId: empData.tenantId,
        branchId: empData.branchId || 'main',
        department: empData.department || '',
        status: empData.status,
        activationStatus: empData.activationStatus,
        expiresAt: empData.expiresAt,
        restaurantName: restaurantName,
      }
    });
  } catch (err: any) {
    console.error('[verify-invitation API] Error:', err);
    return res.status(500).json({
      error: 'Failed to verify invitation. Please try again.',
      code: 'SERVER_ERROR',
    });
  }
}
