import { z } from 'zod/v4';

export const expenseHeaderSchema = z.object({
  delivererId: z.string().min(1, 'Please select a deliverer'),
  voucherDate: z.string().min(1, 'Voucher date is required'),
  approvedBy: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'FAILED']),
});

export const paymentHeaderSchema = z.object({
  deliverer: z.string().min(1, 'Please select a deliverer'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  startDate: z.string().min(1, 'Period start is required'),
  endDate: z.string().min(1, 'Period end is required'),
  status: z.enum(['PENDING', 'PROCESSING', 'PAID', 'COMPLETED', 'FAILED', 'CANCELLED']),
});
