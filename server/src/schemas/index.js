'use strict';
const z = require('zod');

// ── Addresses ────────────────────────────────────────────────
const addressCreate = z.object({
  address_name:   z.string().min(1, 'required'),
  address_type:   z.string().min(1, 'required'),
  address_line_1: z.string().min(1, 'required'),
  city:           z.string().min(1, 'required'),
  country_code:   z.string().length(2, 'must be 2 characters (ISO 3166-1 alpha-2)'),
  latitude:       z.number().min(-90, 'must be between -90 and 90').max(90, 'must be between -90 and 90').optional(),
  longitude:      z.number().min(-180, 'must be between -180 and 180').max(180, 'must be between -180 and 180').optional(),
}).passthrough();

const addressUpdate = z.object({
  country_code: z.string().length(2, 'must be 2 characters').optional(),
  latitude:     z.number().min(-90, 'must be between -90 and 90').max(90, 'must be between -90 and 90').optional(),
  longitude:    z.number().min(-180, 'must be between -180 and 180').max(180, 'must be between -180 and 180').optional(),
}).passthrough();

// ── Profiles ─────────────────────────────────────────────────
const profileCreate = z.object({
  full_name: z.string().min(1, 'required'),
  phone:     z.string().min(1, 'required'),
  email:     z.string().min(1, 'required').email('must be a valid email address'),
}).passthrough();

const profileUpdate = z.object({
  email: z.string().email('must be a valid email address').optional(),
}).passthrough();

// ── Customers ────────────────────────────────────────────────
const customerCreate = z.object({
  profile_id:       z.union([z.string().min(1, 'required'), z.number()]),
  address_id:       z.union([z.string().min(1, 'required'), z.number()]),
  membership_level: z.enum(['Bronze', 'Silver', 'Gold', 'Platinum'], { errorMap: () => ({ message: 'must be one of Bronze, Silver, Gold, Platinum' }) }),
}).passthrough();

const customerUpdate = z.object({
  membership_level: z.enum(['Bronze', 'Silver', 'Gold', 'Platinum'], { errorMap: () => ({ message: 'must be one of Bronze, Silver, Gold, Platinum' }) }).optional(),
}).passthrough();

// ── Deliverers ───────────────────────────────────────────────
const delivererCreate = z.object({
  profile_id:     z.union([z.string().min(1, 'required'), z.number()]),
  vehicle_type:   z.string().min(1, 'required'),
  license_plate:  z.string().min(1, 'required'),
  current_status: z.enum(['AVAILABLE', 'BUSY', 'OFFLINE'], { errorMap: () => ({ message: 'must be one of AVAILABLE, BUSY, OFFLINE' }) }).optional(),
}).passthrough();

const delivererUpdate = z.object({
  current_status: z.enum(['AVAILABLE', 'BUSY', 'OFFLINE'], { errorMap: () => ({ message: 'must be one of AVAILABLE, BUSY, OFFLINE' }) }).optional(),
  rating:         z.number().min(0, 'must be between 0 and 5').max(5, 'must be between 0 and 5').optional(),
}).passthrough();

// ── Stores ───────────────────────────────────────────────────
const storeCreate = z.object({
  name:       z.string().min(1, 'required'),
  address_id: z.union([z.string().min(1, 'required'), z.number()]),
  category:   z.string().min(1, 'required'),
  status:     z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED'], { errorMap: () => ({ message: 'must be one of ACTIVE, INACTIVE, SUSPENDED' }) }).optional(),
}).passthrough();

const storeUpdate = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED'], { errorMap: () => ({ message: 'must be one of ACTIVE, INACTIVE, SUSPENDED' }) }).optional(),
  rating: z.number().min(0, 'must be between 0 and 5').max(5, 'must be between 0 and 5').optional(),
}).passthrough();

// ── Store Products ───────────────────────────────────────────
const PRODUCT_STATUS = ['AVAILABLE', 'OUT_OF_STOCK', 'DISCONTINUED', 'UNAVAILABLE'];
const storeProductCreate = z.object({
  store_code: z.string().min(1, 'required'),
  name:       z.string().min(1, 'required'),
  unit_price: z.number({ required_error: 'required' }).min(0, 'must be >= 0'),
  status:     z.enum(PRODUCT_STATUS, { errorMap: () => ({ message: `must be one of ${PRODUCT_STATUS.join(', ')}` }) }).optional(),
}).passthrough();

const storeProductUpdate = z.object({
  unit_price: z.number().min(0, 'must be >= 0').optional(),
  status:     z.enum(PRODUCT_STATUS, { errorMap: () => ({ message: `must be one of ${PRODUCT_STATUS.join(', ')}` }) }).optional(),
}).passthrough();

// ── Order Items ──────────────────────────────────────────────
const orderItemCreate = z.object({
  product_id:   z.union([z.string().min(1, 'required'), z.number()]),
  quantity:     z.number({ required_error: 'must be > 0' }).positive('must be > 0'),
  unit_price:   z.number({ required_error: 'required, must be >= 0' }).min(0, 'required, must be >= 0'),
  extend_price: z.number({ required_error: 'required (calculated by frontend), must be >= 0' }).min(0, 'required (calculated by frontend), must be >= 0'),
}).passthrough();

const orderItemUpdate = z.object({
  product_id:   z.union([z.string().min(1, 'required'), z.number()]),
  quantity:     z.number({ required_error: 'must be > 0' }).positive('must be > 0').optional(),
  extend_price: z.number({ required_error: 'required, must be >= 0' }).min(0, 'required, must be >= 0').optional(),
}).passthrough();

// ── Orders ───────────────────────────────────────────────────
const MUTABLE_ORDER_STATUS = ['PENDING', 'CONFIRMED', 'CANCELLED'];
const ALL_ORDER_STATUS = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'DISPATCHED', 'DELIVERING', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED'];
const orderCreate = z.object({
  customer_code:    z.string().min(1, 'required'),
  store_code:       z.string().min(1, 'required'),
  address_snapshot: z.any().refine(v => v !== undefined && v !== null && v !== '', { message: 'required' }),
  total_price:      z.number({ required_error: 'required (calculated by frontend)' }).min(0, 'must be >= 0'),
  order_items:      z.array(orderItemCreate).min(1, 'must have at least 1 item'),
}).passthrough();

const orderUpdate = z.object({
  status:           z.enum(ALL_ORDER_STATUS, { errorMap: () => ({ message: `must be one of ${ALL_ORDER_STATUS.join(', ')}` }) }).optional(),
  address_snapshot: z.any().optional(),
  total_price:      z.number().min(0, 'must be >= 0').optional(),
  order_items:      z.array(orderItemUpdate).optional(),
}).passthrough();

// ── Deliveries ───────────────────────────────────────────────
const DELIVERY_TYPES = ['STANDARD', 'HURRY', 'EXPRESS', 'SCHEDULED'];
const deliveryCreate = z.object({
  order_code:     z.string().min(1, 'required'),
  deliverer_code: z.string().min(1, 'required'),
  delivery_type:  z.enum(DELIVERY_TYPES, { errorMap: () => ({ message: `must be one of ${DELIVERY_TYPES.join(', ')}` }) }),
  delivery_fee:   z.number({ required_error: 'required' }).min(0, 'must be >= 0'),
}).passthrough();

const deliveryUpdate = z.object({
  delivery_type: z.enum(DELIVERY_TYPES, { errorMap: () => ({ message: `must be one of ${DELIVERY_TYPES.join(', ')}` }) }).optional(),
  delivery_fee:  z.number().min(0, 'must be >= 0').optional(),
}).passthrough();

// ── Dispatch Assignments ─────────────────────────────────────
const DISPATCH_STATUS = ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'];
const dispatchAssignmentCreate = z.object({
  order_code:     z.string().min(1, 'required'),
  deliverer_code: z.string().min(1, 'required'),
}).passthrough();

const dispatchAssignmentUpdate = z.object({
  status: z.enum(DISPATCH_STATUS, { errorMap: () => ({ message: `must be one of ${DISPATCH_STATUS.join(', ')}` }) }),
}).passthrough();

// ── Expense Items ────────────────────────────────────────────
const EXPENSE_TYPES = ['FUEL', 'MAINTENANCE', 'TOLL', 'OTHER'];
const expenseItemSchema = z.object({
  expense_type: z.enum(EXPENSE_TYPES, { errorMap: () => ({ message: `must be one of ${EXPENSE_TYPES.join(', ')}` }) }),
  description:  z.string().min(1, 'required'),
  amount:       z.number({ required_error: 'must be > 0' }).positive('must be > 0'),
}).passthrough();

// ── Expense Vouchers ─────────────────────────────────────────
const expenseVoucherCreate = z.object({
  delivery_id:   z.number({ required_error: 'required' }).int().positive('must be a positive integer'),
  voucher_date:  z.string().min(1, 'required').refine(v => new Date(v) <= new Date(), { message: 'cannot be a future date' }),
  total_amount:  z.union([z.number(), z.string()]).refine(v => v !== undefined && v !== null, { message: 'required (calculated by frontend)' }),
  expense_items: z.array(expenseItemSchema).min(1, 'must have at least 1 item'),
}).passthrough();

const expenseVoucherUpdate = z.object({
  status:        z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'FAILED', 'SUBMITTED'], { errorMap: () => ({ message: 'must be one of DRAFT, PENDING, APPROVED, REJECTED, FAILED, SUBMITTED' }) }).optional(),
  voucher_date:  z.string().refine(v => new Date(v) <= new Date(), { message: 'cannot be a future date' }).optional(),
  total_amount:  z.number().min(0, 'must be >= 0').optional(),
  expense_items: z.array(expenseItemSchema).optional(),
}).passthrough();

// ── Payment Items ────────────────────────────────────────────
const paymentItemSchema = z.object({
  order_code:   z.string().min(1, 'required'),
  delivery_fee: z.number({ required_error: 'required, must be >= 0' }).min(0, 'required, must be >= 0'),
  bonus:        z.number({ required_error: 'required, must be >= 0' }).min(0, 'required, must be >= 0'),
}).passthrough();

// ── Payments ─────────────────────────────────────────────────
const paymentCreate = z.object({
  delivery_id:          z.number({ required_error: 'required' }).int().positive('must be a positive integer'),
  payment_period_start: z.string().min(1, 'required'),
  payment_period_end:   z.string().min(1, 'required'),
  total_payment:        z.number({ required_error: 'required (calculated by frontend)' }).min(0, 'must be >= 0'),
  payment_items:        z.array(paymentItemSchema).min(1, 'must have at least 1 item'),
}).passthrough();

const paymentUpdate = z.object({
  status:        z.enum(['PENDING', 'PROCESSING', 'PAID', 'COMPLETED', 'FAILED', 'CANCELLED'], { errorMap: () => ({ message: 'must be one of PENDING, PROCESSING, PAID, COMPLETED, FAILED, CANCELLED' }) }).optional(),
  total_payment: z.number().min(0, 'must be >= 0').optional(),
  payment_items: z.array(paymentItemSchema).optional(),
}).passthrough();

// ── Promotions ───────────────────────────────────────────────
const DISCOUNT_TYPES = ['PERCENTAGE', 'FIXED_AMOUNT'];

const promotionItemCreate = z.object({
  product_id:     z.union([z.string().min(1, 'required'), z.number()]),
  discount_value: z.number({ required_error: 'must be > 0' }).positive('must be > 0'),
}).passthrough();

const promotionCreate = z.object({
  store_code:      z.string().min(1, 'required'),
  name:            z.string().min(1, 'required'),
  start_date:      z.string().min(1, 'required'),
  end_date:        z.string().min(1, 'required'),
  discount_type:   z.enum(DISCOUNT_TYPES, { errorMap: () => ({ message: `must be one of ${DISCOUNT_TYPES.join(', ')}` }) }),
  promotion_items: z.array(promotionItemCreate).min(1, 'must have at least 1 item'),
}).passthrough();

const promotionItemUpdate = z.object({
  product_id:     z.union([z.string().min(1, 'required'), z.number()]),
  discount_value: z.number({ required_error: 'must be > 0' }).positive('must be > 0'),
}).passthrough();

const promotionUpdate = z.object({
  discount_type:   z.enum(DISCOUNT_TYPES, { errorMap: () => ({ message: `must be one of ${DISCOUNT_TYPES.join(', ')}` }) }).optional(),
  promotion_items: z.array(promotionItemUpdate).optional(),
}).passthrough();

// ── Favorite Stores ──────────────────────────────────────────
const favoriteStoreCreate = z.object({
  customer_code: z.string().min(1, 'required'),
  store_code:    z.string().min(1, 'required'),
}).passthrough();

const favoriteStoreUpdate = z.object({
  new_customer_code: z.string().min(1, 'required'),
  new_store_code:    z.string().min(1, 'required'),
}).passthrough();

// ── Reviews ──────────────────────────────────────────────────
const REVIEW_TARGETS = ['STORE', 'DELIVERER'];
const reviewCreate = z.object({
  order_code:    z.string().min(1, 'required'),
  customer_code: z.string().min(1, 'required'),
  rating:        z.number({ required_error: 'required' }).int().min(1, 'must be between 1 and 5').max(5, 'must be between 1 and 5'),
  target:        z.enum(REVIEW_TARGETS, { errorMap: () => ({ message: `must be one of ${REVIEW_TARGETS.join(', ')}` }) }),
}).passthrough();

const reviewUpdate = z.object({
  rating: z.number().int().min(1, 'must be between 1 and 5').max(5, 'must be between 1 and 5').optional(),
  target: z.enum(REVIEW_TARGETS, { errorMap: () => ({ message: `must be one of ${REVIEW_TARGETS.join(', ')}` }) }).optional(),
}).passthrough();

// ── Delivery Location Logs ───────────────────────────────────
const deliveryLocationLogCreate = z.object({
  deliverer_code: z.string().min(1, 'required'),
  latitude:       z.number({ required_error: 'required' }).min(-90, 'must be between -90 and 90').max(90, 'must be between -90 and 90'),
  longitude:      z.number({ required_error: 'required' }).min(-180, 'must be between -180 and 180').max(180, 'must be between -180 and 180'),
}).passthrough();

const deliveryLocationLogUpdate = z.object({
  latitude:  z.number().min(-90, 'must be between -90 and 90').max(90, 'must be between -90 and 90').optional(),
  longitude: z.number().min(-180, 'must be between -180 and 180').max(180, 'must be between -180 and 180').optional(),
}).passthrough();

// ── Exports ──────────────────────────────────────────────────
const schemas = {
  addressCreate, addressUpdate,
  profileCreate, profileUpdate,
  customerCreate, customerUpdate,
  delivererCreate, delivererUpdate,
  storeCreate, storeUpdate,
  storeProductCreate, storeProductUpdate,
  orderCreate, orderUpdate,
  deliveryCreate, deliveryUpdate,
  dispatchAssignmentCreate, dispatchAssignmentUpdate,
  expenseVoucherCreate, expenseVoucherUpdate,
  paymentCreate, paymentUpdate,
  promotionCreate, promotionUpdate,
  favoriteStoreCreate, favoriteStoreUpdate,
  reviewCreate, reviewUpdate,
  deliveryLocationLogCreate, deliveryLocationLogUpdate,
};

module.exports = { schemas };
