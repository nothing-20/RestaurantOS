import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { emailService } from '../email/emailService';

export interface CreateInvitationParams {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  department?: string;
  tenantId: string;
  createdBy: string;
  branchId?: string;
}

export interface CreateInvitationResult {
  success: boolean;
  employeeId: string;
  activationLink: string;
  token: string;
  emailSent: boolean;
  emailError?: string;
  error?: string;
}

/**
 * Generate a cryptographically secure 64-character hex token client-side.
 */
function generateSecureToken(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint8Array(32);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
  }
  // Safe fallback
  return Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export const invitationService = {
  /**
   * Complete staff invitation creation workflow:
   * 1. Validates input
   * 2. Checks for duplicates in Firestore
   * 3. Writes invitation doc to employees collection with status "pending" and activationStatus "invited"
   * 4. Generates a secure activation link
   * 5. Non-blocking attempt to dispatch email
   */
  async createStaffInvitation(params: CreateInvitationParams): Promise<CreateInvitationResult> {
    const { fullName, email, phone, role, department, tenantId, createdBy, branchId } = params;

    const trimmedName = (fullName || '').trim();
    const trimmedEmail = (email || '').trim().toLowerCase();
    const trimmedPhone = (phone || '').trim();
    const trimmedDept = (department || '').trim();

    // 1. Validation
    if (!trimmedName || trimmedName.length < 2) {
      throw new Error('Full name must be at least 2 characters.');
    }
    if (!trimmedEmail || !/\S+@\S+\.\S+/.test(trimmedEmail)) {
      throw new Error('Please enter a valid email address.');
    }
    if (!trimmedPhone) {
      throw new Error('Phone number is required.');
    }
    if (!role) {
      throw new Error('Assigned role is required.');
    }
    if (!tenantId) {
      throw new Error('Missing restaurant tenant context. Please re-login.');
    }

    const validRoles = ['waiter', 'kitchen', 'manager', 'cashier', 'reception', 'admin', 'owner'];
    if (!validRoles.includes(role.toLowerCase())) {
      throw new Error(`Unsupported staff role: "${role}".`);
    }

    // 2. Duplicate check in Firestore employees collection for this tenant
    const empRef = collection(db, 'employees');
    const qDuplicate = query(
      empRef,
      where('tenantId', '==', tenantId),
      where('email', '==', trimmedEmail)
    );

    const dupSnap = await getDocs(qDuplicate);
    if (!dupSnap.empty) {
      const existing = dupSnap.docs.map(d => d.data());
      const isActive = existing.some(e => e.status === 'active' || e.activationStatus === 'activated');
      if (isActive) {
        throw new Error(`An active staff member with email "${trimmedEmail}" already exists in this restaurant.`);
      }
      const isPending = existing.some(e => e.status === 'pending' || e.activationStatus === 'invited');
      if (isPending) {
        throw new Error(`An invitation for "${trimmedEmail}" is already pending activation.`);
      }
    }

    // 3. Token & Document Creation
    const secureToken = generateSecureToken();
    const now = new Date().toISOString();
    // Expiration: 7 days from now
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const employeeDoc = await addDoc(empRef, {
      fullName: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      role: role.toLowerCase(),
      department: trimmedDept || (role.toLowerCase() === 'kitchen' ? 'Kitchen' : 'Service'),
      tenantId: tenantId,
      branchId: branchId || 'main',
      status: 'pending',
      activationStatus: 'invited',
      firebaseUid: null,
      invitedAt: now,
      createdAt: now,
      expiresAt: expiresAt,
      createdBy: createdBy || 'owner',
      updatedAt: now,
      invitationToken: secureToken,
    });

    // 4. Construct Activation Link
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://restaurantos-dun.vercel.app';
    const activationLink = `${origin}/staff/activate?token=${secureToken}&email=${encodeURIComponent(trimmedEmail)}`;

    // 5. Non-blocking attempt to send email
    let emailSent = false;
    let emailError: string | undefined;

    try {
      const emailResult = await emailService.sendStaffInvitation({
        fullName: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        role: role.toLowerCase(),
        department: trimmedDept,
        tenantId: tenantId,
        createdBy: createdBy,
      });

      if (emailResult && emailResult.success) {
        emailSent = true;
      } else if (emailResult && emailResult.error) {
        emailError = emailResult.error;
      }
    } catch (err: any) {
      console.warn('[invitationService] Email dispatch failed/unconfigured:', err.message);
      emailError = err.message;
    }

    return {
      success: true,
      employeeId: employeeDoc.id,
      activationLink,
      token: secureToken,
      emailSent,
      emailError,
    };
  }
};

export const createStaffInvitation = invitationService.createStaffInvitation;
export default invitationService;
