import { z } from 'zod/v4';

export const orderHeaderSchema = z.object({
  customer: z.string().min(1, 'Please select a customer'),
  store: z.string().min(1, 'Please select a store'),
  deliveryAddress: z.string().min(1, 'Delivery address is required'),
});
