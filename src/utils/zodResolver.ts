import { ZodSchema } from 'zod';

/**
 * A lightweight custom Zod resolver for React Hook Form.
 */
export const zodResolver = (schema: ZodSchema<any>) => async (values: any) => {
  try {
    const data = schema.parse(values);
    return {
      values: data,
      errors: {},
    };
  } catch (error: any) {
    const errors = error.errors.reduce((acc: any, current: any) => {
      const fieldPath = current.path.join('.');
      acc[fieldPath] = {
        message: current.message,
        type: current.code,
      };
      return acc;
    }, {});
    return {
      values: {},
      errors,
    };
  }
};
export default zodResolver;
