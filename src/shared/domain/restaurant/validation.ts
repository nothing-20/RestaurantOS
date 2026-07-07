import { z } from 'zod';

export const tenantFormSchema = z.object({
  name: z.string().min(1, 'Restaurant name is required'),
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  zipCode: z.string().min(1, 'Zip code is required')
});

export const inventorySchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  quantity: z.preprocess((val) => Number(val), z.number().min(0, 'Current quantity must be non-negative')),
  minQuantity: z.preprocess((val) => Number(val), z.number().min(0, 'Minimum quantity must be non-negative')),
  supplier: z.string().min(1, 'Supplier is required'),
  unit: z.string().min(1, 'Unit is required'),
  cost: z.preprocess((val) => Number(val), z.number().min(0, 'Cost must be non-negative')),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  expiryDate: z.string().min(1, 'Expiry date is required')
});
