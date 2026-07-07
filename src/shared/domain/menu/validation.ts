import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  image: z.string().url('Must be a valid URL').or(z.literal('')),
  displayOrder: z.preprocess((val) => Number(val), z.number().min(0)),
  isActive: z.boolean().default(true)
});

export const menuItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  categoryId: z.string().min(1, 'Category is required'),
  price: z.preprocess(
    (val) => Number(val),
    z.number().min(0.01, 'Price must be greater than zero')
  ),
  discountPrice: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  isVeg: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  isBestSeller: z.boolean().default(false),
  isRecommended: z.boolean().default(false),
  spiceLevel: z.string().default('none'),
  preparationTime: z.preprocess(
    (val) => Number(val),
    z.number().min(1, 'Prep time must be at least 1 minute')
  ),
  image: z.string().url('Must be a valid URL').or(z.literal(''))
});
