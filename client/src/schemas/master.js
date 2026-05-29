import { z } from 'zod/v4';

export const customerSchema = z.object({
    name: z.string().min(1, 'Full Name is required'),
    phone: z.string().min(1, 'Phone Number is required'),
    address: z.string().optional(),
    description: z.string().optional(),
});

export const delivererSchema = z.object({
    name: z.string().min(1, 'Full Name is required'),
    license: z.string().min(1, 'License Plate is required'),
    phone: z.string().min(1, 'Phone Number is required'),
    type: z.enum(['Motorcycle', 'Car', 'Truck'], { error: 'Vehicle Type is required' }),
    status: z.enum(['Active', 'Inactive'], { error: 'Status is required' }),
});

export const storeSchema = z.object({
    name: z.string().min(1, 'Store Name is required'),
    category: z.enum(['Thai Food', 'Japanese', 'Cafe & Drinks', 'Fast Food', 'Other'], { error: 'Category is required' }),
    phone: z.string().min(1, 'Phone Number is required'),
    address: z.string().min(1, 'Address is required'),
    open: z.string().optional(),
    description: z.string().optional(),
});

export const productSchema = z.object({
    store: z.string().min(1, 'Store is required'),
    name: z.string().min(1, 'Product Name is required'),
    price: z.coerce.number().min(0, 'Price cannot be negative'),
    category: z.enum(['Main Dish', 'Drinks', 'Appetizer', 'Dessert', 'Other'], { error: 'Category is required' }),
    active: z.boolean(),
});

export const promotionSchema = z.object({
    store: z.string().min(1, 'Store is required'),
    name: z.string().min(1, 'Campaign Name is required'),
    discountType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT'], { error: 'Discount Type is required' }),
    startDate: z.string().min(1, 'Start Date is required'),
    endDate: z.string().min(1, 'End Date is required'),
    promoCode: z.string().optional(),
    autoCode: z.boolean().optional(),
});
