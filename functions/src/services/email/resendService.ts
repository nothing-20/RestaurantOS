import { Resend } from 'resend';
import * as admin from 'firebase-admin';

// Check if admin app has been initialized, if not initialize it
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

// Fetch API Key safely from Firebase Config or Environment variables
const getApiKey = (): string => {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error('[ResendService] Missing RESEND_API_KEY environment variable.');
    throw new Error('Missing RESEND_API_KEY configuration.');
  }
  return key;
};

// Retry handler configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const resendService = {
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    type: string,
    options?: { retries?: number }
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const apiKey = getApiKey();
    const resend = new Resend(apiKey);
    
    const retriesLeft = options?.retries ?? MAX_RETRIES;
    const timestamp = new Date().toISOString();
    
    try {
      const response = await resend.emails.send({
        from: 'RestaurantOS <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: html,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Store success in Firestore emailLogs
      await db.collection('emailLogs').add({
        recipient: to,
        subject: subject,
        status: 'success',
        provider: 'resend',
        type: type,
        emailId: response.data?.id || null,
        createdAt: timestamp,
        error: null,
      });

      return { success: true, id: response.data?.id };
    } catch (err: any) {
      const errMsg = err.message || 'Unknown Resend API error';
      console.warn(`[ResendService] Failed to send email to ${to} (${retriesLeft} retries remaining): ${errMsg}`);

      if (retriesLeft > 0) {
        await delay(RETRY_DELAY_MS);
        return this.sendEmail(to, subject, html, type, { retries: retriesLeft - 1 });
      }

      // Log failure in Firestore emailLogs on final retry exhaust
      await db.collection('emailLogs').add({
        recipient: to,
        subject: subject,
        status: 'failed',
        provider: 'resend',
        type: type,
        createdAt: timestamp,
        error: errMsg,
      });

      return { success: false, error: errMsg };
    }
  }
};
