import { z } from 'zod';

export const tableSchema = z.object({
  tableNumber: z.string().min(1, 'Table number/code is required'),
  tableName: z.string().min(1, 'Table name is required'),
  seatingCapacity: z.preprocess(
    (val) => Number(val),
    z.number().min(1, 'Capacity must be at least 1 person')
  ),
  floor: z.string().min(1, 'Floor selection is required'),
  section: z.string().min(1, 'Section selection is required'),
  notes: z.string().optional(),
  isActive: z.boolean().default(true)
});
