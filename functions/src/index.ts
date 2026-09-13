import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { resendService } from './services/email/resendService';
import { getInviteStaffTemplate } from './services/email/templates/InviteStaff';
import { getWelcomeTemplate } from './services/email/templates/Welcome';
import { getOrderConfirmationTemplate } from './services/email/templates/OrderConfirmation';
import { getReservationTemplate } from './services/email/templates/Reservation';
import { getInvoiceTemplate } from './services/email/templates/Invoice';
import { getPasswordResetTemplate } from './services/email/templates/PasswordReset';
import * as crypto from 'crypto';

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

// 1. sendStaffInvitation
export const sendStaffInvitation = functions.https.onCall(async (data, context) => {
  // Guard check: user must be authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { fullName, email, phone, role, department, tenantId, createdBy } = data;

  if (!fullName || !email || !role || !tenantId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required invitation arguments.');
  }

  try {
    const trimmedEmail = email.trim().toLowerCase();

    // Check duplicate pending invite in Firestore employees collection
    const checkQ = await db.collection('employees')
      .where('email', '==', trimmedEmail)
      .where('tenantId', '==', tenantId)
      .limit(1)
      .get();

    if (!checkQ.empty) {
      throw new functions.https.HttpsError('already-exists', `An invitation or employee with email ${trimmedEmail} already exists.`);
    }

    const secureToken = crypto.randomBytes(32).toString('hex');
    const now = new Date().toISOString();

    // Write invitation document to employees
    const employeeRef = await db.collection('employees').add({
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
      createdBy: createdBy || context.auth.uid,
      updatedAt: now,
      invitationToken: secureToken
    });

    // Generate canonical activation link (using origin of the request or default production fallback)
    const requestOrigin = context.rawRequest?.headers?.origin || 'https://restaurant-os-dun.vercel.app';
    const activationLink = `${requestOrigin}/staff/activate?token=${encodeURIComponent(secureToken)}&email=${encodeURIComponent(trimmedEmail)}&id=${encodeURIComponent(employeeRef.id)}`;

    const templateHtml = getInviteStaffTemplate({
      fullName: fullName,
      role: role,
      department: department || (role === 'kitchen' ? 'Kitchen' : 'Service'),
      activationLink: activationLink
    });

    const emailRes = await resendService.sendEmail(
      trimmedEmail,
      'Invitation to Join RestaurantOS Team',
      templateHtml,
      'staff_invitation'
    );

    if (!emailRes.success) {
      throw new Error(emailRes.error || 'Resend failed to deliver email.');
    }

    return { success: true, employeeId: employeeRef.id };
  } catch (err: any) {
    console.error('[sendStaffInvitation] Error:', err);
    throw new functions.https.HttpsError('internal', err.message || 'Failed to process staff invitation.');
  }
});

// 2. sendWelcomeEmail
export const sendWelcomeEmail = functions.https.onCall(async (data, context) => {
  const { email, fullName, restaurantName } = data;
  if (!email || !fullName) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing email or fullName.');
  }

  try {
    const templateHtml = getWelcomeTemplate({ fullName, restaurantName });
    const emailRes = await resendService.sendEmail(
      email.trim(),
      'Welcome to RestaurantOS!',
      templateHtml,
      'welcome_email'
    );

    return { success: emailRes.success, error: emailRes.error };
  } catch (err: any) {
    console.error('[sendWelcomeEmail] Error:', err);
    throw new functions.https.HttpsError('internal', err.message || 'Failed to send welcome email.');
  }
});

// 3. sendOrderConfirmation
export const sendOrderConfirmation = functions.https.onCall(async (data, context) => {
  const { email, customerName, orderNumber, restaurantName, total } = data;
  if (!email || !customerName || !orderNumber || !restaurantName || !total) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required order details.');
  }

  try {
    const templateHtml = getOrderConfirmationTemplate({
      customerName,
      orderNumber,
      restaurantName,
      date: new Date().toLocaleDateString(),
      total
    });

    const emailRes = await resendService.sendEmail(
      email.trim(),
      `Order Confirmation #${orderNumber}`,
      templateHtml,
      'order_confirmation'
    );

    return { success: emailRes.success, error: emailRes.error };
  } catch (err: any) {
    console.error('[sendOrderConfirmation] Error:', err);
    throw new functions.https.HttpsError('internal', err.message || 'Failed to send order confirmation.');
  }
});

// 4. sendReservationConfirmation
export const sendReservationConfirmation = functions.https.onCall(async (data, context) => {
  const { email, customerName, restaurantName, date, time, partySize, tableNumber } = data;
  if (!email || !customerName || !restaurantName || !date || !time || !partySize) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required reservation details.');
  }

  try {
    const templateHtml = getReservationTemplate({
      customerName,
      restaurantName,
      date,
      time,
      partySize,
      tableNumber
    });

    const emailRes = await resendService.sendEmail(
      email.trim(),
      'Your Table Reservation is Confirmed!',
      templateHtml,
      'reservation_confirmation'
    );

    return { success: emailRes.success, error: emailRes.error };
  } catch (err: any) {
    console.error('[sendReservationConfirmation] Error:', err);
    throw new functions.https.HttpsError('internal', err.message || 'Failed to send reservation confirmation.');
  }
});

// 5. sendInvoiceEmail
export const sendInvoiceEmail = functions.https.onCall(async (data, context) => {
  const { email, customerName, invoiceId, items, subtotal, tax, total } = data;
  if (!email || !customerName || !invoiceId || !items || !subtotal || !tax || !total) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing invoice details.');
  }

  try {
    const templateHtml = getInvoiceTemplate({
      customerName,
      invoiceId,
      date: new Date().toLocaleDateString(),
      items,
      subtotal,
      tax,
      total
    });

    const emailRes = await resendService.sendEmail(
      email.trim(),
      `Your Invoice Receipt #${invoiceId}`,
      templateHtml,
      'invoice_email'
    );

    return { success: emailRes.success, error: emailRes.error };
  } catch (err: any) {
    console.error('[sendInvoiceEmail] Error:', err);
    throw new functions.https.HttpsError('internal', err.message || 'Failed to send invoice email.');
  }
});

// 6. sendPasswordResetEmail
export const sendPasswordResetEmail = functions.https.onCall(async (data, context) => {
  const { email, fullName, resetLink } = data;
  if (!email || !fullName || !resetLink) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required arguments for reset.');
  }

  try {
    const templateHtml = getPasswordResetTemplate({ fullName, resetLink });
    const emailRes = await resendService.sendEmail(
      email.trim(),
      'Reset Your RestaurantOS Password',
      templateHtml,
      'password_reset'
    );

    return { success: emailRes.success, error: emailRes.error };
  } catch (err: any) {
    console.error('[sendPasswordResetEmail] Error:', err);
    throw new functions.https.HttpsError('internal', err.message || 'Failed to send reset password email.');
  }
});
