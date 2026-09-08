import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { Resend } from 'resend';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

// Safe Resend API Key resolver
const getResendApiKey = (): string => {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error('[Vercel API] Missing RESEND_API_KEY environment variable.');
    throw new Error('Server misconfiguration: Missing RESEND_API_KEY.');
  }
  return key;
};

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  tenantId?: string;
  type: string;
  retries?: number;
}

export const sendMailWithLogging = async (
  options: SendMailOptions
): Promise<{ success: boolean; id?: string; error?: string }> => {
  const { to, subject, html, tenantId, type } = options;
  const retriesLeft = options.retries ?? MAX_RETRIES;
  const timestamp = new Date().toISOString();

  try {
    const apiKey = getResendApiKey();
    const resend = new Resend(apiKey);

    const response = await resend.emails.send({
      from: 'RestaurantOS <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html,
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    // Task 9: Log success in Firestore emailLogs
    await addDoc(collection(db, 'emailLogs'), {
      recipient: to,
      subject: subject,
      tenant: tenantId || null,
      status: 'success',
      provider: 'resend',
      timestamp: timestamp,
      type: type,
      emailId: response.data?.id || null,
      error: null,
    });

    return { success: true, id: response.data?.id };
  } catch (err: any) {
    const errMsg = err.message || 'Unknown Resend API error';
    console.warn(`[Vercel API] Failed to send email to ${to} (${retriesLeft} retries remaining): ${errMsg}`);

    if (retriesLeft > 0) {
      await delay(RETRY_DELAY_MS);
      return sendMailWithLogging({ ...options, retries: retriesLeft - 1 });
    }

    // Task 9 & 12: Log failure in Firestore emailLogs on final retry exhaust
    try {
      await addDoc(collection(db, 'emailLogs'), {
        recipient: to,
        subject: subject,
        tenant: tenantId || null,
        status: 'failed',
        provider: 'resend',
        timestamp: timestamp,
        type: type,
        error: errMsg,
      });
    } catch (logErr) {
      console.error('[Vercel API] Failed to write failure log to Firestore:', logErr);
    }

    return { success: false, error: errMsg };
  }
};
