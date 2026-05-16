// ==========================================
// MOCK DATA
// ==========================================

export const MOCK_CUSTOMERS = [
    { id: 'C-101', name: 'Adisak M.', phone: '081-234-5678', address: '123 Sukhumvit', created: '2025-10-15' },
    { id: 'C-102', name: 'Nattapong K.', phone: '089-876-5432', address: '456 Silom', created: '2025-11-20' },
    { id: 'C-103', name: 'Siriporn L.', phone: '085-111-2222', address: '789 Rama IV', created: '2025-12-01' },
];

export const MOCK_DELIVERERS = [
    { id: 'D-001', name: 'Somchai J.', license: '1กข 1234', type: 'Motorcycle', phone: '081-111-2345', status: 'Active', rating: 4.8, deliveries: 342 },
    { id: 'D-045', name: 'Kittisak P.', license: '2คต 5678', type: 'Truck', phone: '089-222-3456', status: 'Active', rating: 4.5, deliveries: 210 },
    { id: 'D-022', name: 'Wanchai B.', license: '3มน 9012', type: 'Motorcycle', phone: '085-333-4567', status: 'Inactive', rating: 4.2, deliveries: 98 },
];

export const MOCK_STORES = [
    { id: 'ST-001', name: 'Somchai Kitchen', category: 'Thai Food', address: '123 Rama 9 Rd.', phone: '02-123-4567', open: '09:00-21:00' },
    { id: 'ST-002', name: 'Krapow Station', category: 'Thai Food', address: '456 Sukhumvit Rd.', phone: '02-987-6543', open: '10:00-22:00' },
    { id: 'ST-003', name: 'BKK Cafe', category: 'Cafe & Drinks', address: '789 Silom Rd.', phone: '02-456-7890', open: '08:00-20:00' },
];

export const MOCK_PRODUCTS = [
    { id: 'PRD-101', store: 'Somchai Kitchen', storeId: 'ST-001', name: 'Krapow Moo Saap', price: 60, active: true, category: 'Main Dish' },
    { id: 'PRD-105', store: 'Somchai Kitchen', storeId: 'ST-001', name: 'Pad Thai Goong Sod', price: 90, active: true, category: 'Main Dish' },
    { id: 'PRD-203', store: 'BKK Cafe', storeId: 'ST-003', name: 'Thai Iced Tea', price: 40, active: true, category: 'Drinks' },
    { id: 'PRD-204', store: 'BKK Cafe', storeId: 'ST-003', name: 'Americano', price: 55, active: false, category: 'Drinks' },
];

export const INITIAL_ORDERS = [
    { id: 'ORD-2026-000123', date: '2026-03-22', fee: 40, bonus: 0, adjustment: 0, status: 'Unpaid', customer: 'Adisak M.', deliverer: 'D-001' },
    { id: 'ORD-2026-000124', date: '2026-03-21', fee: 40, bonus: 0, adjustment: 0, status: 'Unpaid', customer: 'Nattapong K.', deliverer: 'D-001' },
];

export const INITIAL_EXPENSE_VOUCHERS = [
    { id: 'EXP-2026-000789', delivererId: 'D-001', delivererName: 'Somchai J.', date: '2026-03-20', status: 'SUBMITTED', total: 150, items: 'Toll' },
    { id: 'EXP-2026-000790', delivererId: 'D-045', delivererName: 'Kittisak P.', date: '2026-03-18', status: 'APPROVED', total: 45, items: 'Parking' },
    { id: 'EXP-2026-000791', delivererId: 'D-022', delivererName: 'Wanchai B.', date: '2026-03-15', status: 'SUBMITTED', total: 320, items: 'Fuel, Toll' },
];

export const MOCK_PREPARED_ORDERS = [
    { id: 'ORD-2026-009101', customer: 'Adisak M.', store: 'Krapow Station', time: '10 mins ago', status: 'Prepared' },
    { id: 'ORD-2026-009102', customer: 'Nattapong K.', store: 'BKK Cafe', time: '5 mins ago', status: 'Prepared' },
];

export const MOCK_PROMOTIONS = [
    { id: 'PROMO-2026-001', name: 'Summer Sale', store: 'Somchai Kitchen', storeId: 'ST-001', startDate: '2026-04-01', endDate: '2026-04-30', status: 'Active', discountType: 'PERCENTAGE', revenue: 12400, products: 3, orders: 142 },
    { id: 'PROMO-2026-002', name: 'Weekend Special', store: 'BKK Cafe', storeId: 'ST-003', startDate: '2026-03-01', endDate: '2026-03-31', status: 'Active', discountType: 'FIXED_AMOUNT', revenue: 8200, products: 2, orders: 85 },
];

export const MOCK_RECEIPT_ITEMS = [
    { id: 'PRD-101', name: 'Krapow Moo Saap', qty: 2, price: 60, total: 120 },
    { id: 'PRD-203', name: 'Thai Iced Tea', qty: 2, price: 40, total: 80 },
];

export const MOCK_TOP_PRODUCTS = [
    { rank: 1, store: 'Somchai Kitchen', id: 'PRD-101', name: 'Krapow Moo Saap', category: 'Main Dish', qty: 342, revenue: 20520 },
    { rank: 2, store: 'Somchai Kitchen', id: 'PRD-105', name: 'Pad Thai Goong Sod', category: 'Main Dish', qty: 218, revenue: 19620 },
    { rank: 3, store: 'BKK Cafe', id: 'PRD-203', name: 'Thai Iced Tea', category: 'Drinks', qty: 195, revenue: 7800 },
];

export const MOCK_EXPENSE_SUMMARY_STATS = { count: 124, sum: 15600, avg: 125.80 };

export const MOCK_DELIVERED_ORDERS = [
    { id: 'ORD-2026-008001', date: '2026-03-21', customer: 'Adisak M.', store: 'Somchai Kitchen', total: 320, deliverer: 'Somchai J.', duration: '35 mins' },
    { id: 'ORD-2026-008002', date: '2026-03-20', customer: 'Nattapong K.', store: 'BKK Cafe', total: 150, deliverer: 'Kittisak P.', duration: '42 mins' },
    { id: 'ORD-2026-008003', date: '2026-03-20', customer: 'Siriporn L.', store: 'Krapow Station', total: 90, deliverer: 'Somchai J.', duration: '28 mins' },
];

export const MOCK_FAV_STORES = [
    { customer: 'Adisak M.', store: 'Somchai Kitchen', orders: 24 },
    { customer: 'Nattapong K.', store: 'BKK Cafe', orders: 18 },
    { customer: 'Siriporn L.', store: 'Krapow Station', orders: 12 },
];

export const MOCK_TOP_DELIVERERS = [
    { rank: 1, id: 'D-001', name: 'Somchai J.', type: 'Motorcycle', deliveries: 342, earnings: 15390, rating: 4.8 },
    { rank: 2, id: 'D-045', name: 'Kittisak P.', type: 'Truck', deliveries: 210, earnings: 9450, rating: 4.5 },
    { rank: 3, id: 'D-022', name: 'Wanchai B.', type: 'Motorcycle', deliveries: 98, earnings: 4410, rating: 4.2 },
];

export const MOCK_REVENUE_PER_TRIP = [
    { id: 1, date: '2026-01-01', revenue: 40, notes: 'Initial rate' },
    { id: 2, date: '2026-03-01', revenue: 45, notes: 'Q1 adjustment' },
];

export const MOCK_DELIVERER_HISTORY = [
    { id: 'ORD-2026-008001', date: '2026-03-21', store: 'Somchai Kitchen', customer: 'Adisak M.', time: '14:35', fee: 45, status: 'Delivered' },
    { id: 'ORD-2026-008003', date: '2026-03-20', store: 'Krapow Station', customer: 'Siriporn L.', time: '14:35', fee: 45, status: 'Delivered' },
    { id: 'ORD-2026-007921', date: '2026-03-18', store: 'BKK Cafe', customer: 'Nattapong K.', time: '14:35', fee: 45, status: 'Delivered' },
];
