import { ZodSchema } from 'zod';

/**
 * A lightweight custom Zod resolver for React Hook Form.
 */
export const zodResolver = (schema: ZodSchema<any>) => async (values: any) => {
  console.log('[Resolver] Start validating values:', values);
  try {
    const data = schema.parse(values);
    console.log('[Resolver] Validation Passed:', data);
    return {
      values: data,
      errors: {},
    };
  } catch (error: any) {
    const errorList = error.errors || [];
    const errors = errorList.reduce((acc: any, current: any) => {
      const fieldPath = current.path.join('.');
      acc[fieldPath] = {
        message: current.message,
        type: current.code || 'validation',
      };
      return acc;
    }, {});
    
    console.warn('[Resolver] Validation Failed Errors:', errors);

    return {
      values: {},
      errors,
    };
  }
};
export default zodResolver;
