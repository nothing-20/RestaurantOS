import { z } from 'zod';

export const QrParamsSchema = z.object({
  r: z.string().min(1, 'Restaurant ID is required'),
  b: z.string().min(1, 'Branch ID is required'),
  t: z.string().min(1, 'Table ID is required'),
  s: z.string().min(1, 'Secure Token is required'),
});

export type TQrParams = z.infer<typeof QrParamsSchema>;

export const DiningSessionSchema = z.object({
  sessionId: z.string().uuid('Session ID must be a valid UUID'),
  restaurantId: z.string().min(1, 'Restaurant ID is required'),
  branchId: z.string().min(1, 'Branch ID is required'),
  tableId: z.string().min(1, 'Table ID is required'),
  startedAt: z.string().datetime('Started at must be a valid ISO timestamp'),
  deviceId: z.string().min(1, 'Device ID is required'),
  language: z.string().min(2, 'Language code must be at least 2 characters'),
});

export type TDiningSession = z.infer<typeof DiningSessionSchema>;
