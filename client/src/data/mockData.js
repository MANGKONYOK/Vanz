import { getJson } from '../api/http';

const FALLBACK = {
  MOCK_CUSTOMERS: [],
  MOCK_DELIVERERS: [],
  MOCK_STORES: [],
  MOCK_PRODUCTS: [],
  INITIAL_ORDERS: [],
  INITIAL_EXPENSE_VOUCHERS: [],
  MOCK_PREPARED_ORDERS: [],
  MOCK_PROMOTIONS: [],
  MOCK_RECEIPT_ITEMS: [],
  MOCK_TOP_PRODUCTS: [],
  MOCK_EXPENSE_SUMMARY_STATS: { count: 0, sum: 0, avg: 0 },
  MOCK_DELIVERED_ORDERS: [],
  MOCK_FAV_STORES: [],
  MOCK_TOP_DELIVERERS: [],
  MOCK_REVENUE_PER_TRIP: [],
  MOCK_DELIVERER_HISTORY: [],
  PAYMENT_SUMMARIES: [],
};

function dateOnly(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function capitalize(value) {
  if (!value) return '';
  const text = String(value).toLowerCase().replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function normalizeDelivererStatus(status) {
  const v = String(status || '').toUpperCase();
  return v === 'OFFLINE' ? 'Inactive' : 'Active';
}

function normalizeProductStatus(status) {
  return String(status || '').toUpperCase();
}

function buildDuration(pickupTime, deliveryTime) {
  if (!pickupTime || !deliveryTime) return '-';
  const start = new Date(pickupTime).getTime();
  const end = new Date(deliveryTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return '-';
  const mins = Math.round((end - start) / 60000);
  return `${mins} mins`;
}

async function safeGet(path, params = {}) {
  try {
    const data = await getJson(path, params);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function loadLiveData() {
  const [
    addresses,
    profiles,
    customers,
    deliverers,
    stores,
    products,
    orders,
    deliveries,
    vouchers,
    payments,
    promotions,
    favoriteStores,
  ] = await Promise.all([
    safeGet('/addresses'),
    safeGet('/profiles'),
    safeGet('/customers'),
    safeGet('/deliverers'),
    safeGet('/stores'),
    safeGet('/store-products'),
    safeGet('/orders'),
    safeGet('/deliveries'),
    safeGet('/expense-vouchers'),
    safeGet('/payments'),
    safeGet('/promotions'),
    safeGet('/favorite-stores'),
  ]);

  const addressById = new Map(
    addresses.map((a) => [
      a.address_id,
      [a.address_line_1, a.city, a.country_code].filter(Boolean).join(', '),
    ]),
  );

  const profileById = new Map(profiles.map((p) => [p.profile_id, p]));
  const storeById = new Map(stores.map((s) => [s.store_id, s]));
  const storeByCode = new Map(stores.map((s) => [s.store_code, s]));
  const customerById = new Map(customers.map((c) => [c.customer_id, c]));
  const customerByCode = new Map(customers.map((c) => [c.customer_code, c]));
  const delivererById = new Map(deliverers.map((d) => [d.deliverer_id, d]));
  const orderById = new Map(orders.map((o) => [o.order_id, o]));

  const deliveriesByOrderId = new Map(deliveries.map((d) => [d.order_id, d]));
  const deliveryById = new Map(deliveries.map((d) => [d.delivery_id, d]));

  const paymentOrderIds = new Set();
  for (const payment of payments) {
    const items = Array.isArray(payment.payment_items) ? payment.payment_items : [];
    for (const item of items) {
      paymentOrderIds.add(item.order_id);
    }
  }

  const delivererProfileName = (delivererId) => {
    const deliverer = delivererById.get(delivererId);
    if (!deliverer) return `Deliverer ${delivererId}`;
    const profile = profileById.get(deliverer.profile_id);
    return profile?.full_name || deliverer.deliverer_code;
  };

  const customerProfileName = (customerId) => {
    const customer = customerById.get(customerId);
    if (!customer) return `Customer ${customerId}`;
    const profile = profileById.get(customer.profile_id);
    return profile?.full_name || customer.customer_code;
  };

  const MOCK_CUSTOMERS = customers.map((c) => {
    const profile = profileById.get(c.profile_id);
    return {
      id: c.customer_code,
      name: profile?.full_name || c.customer_code,
      phone: profile?.phone || '-',
      address: addressById.get(c.address_id) || `Address #${c.address_id}`,
      created: dateOnly(c.created_at),
    };
  });

  const deliveriesCountByDeliverer = new Map();
  for (const d of deliveries) {
    deliveriesCountByDeliverer.set(
      d.deliverer_id,
      (deliveriesCountByDeliverer.get(d.deliverer_id) || 0) + 1,
    );
  }

  const MOCK_DELIVERERS = deliverers.map((d) => {
    const profile = profileById.get(d.profile_id);
    return {
      id: d.deliverer_code,
      name: profile?.full_name || d.deliverer_code,
      license: d.license_plate || '-',
      type: capitalize(d.vehicle_type),
      phone: profile?.phone || '-',
      status: normalizeDelivererStatus(d.current_status),
      rating: toNumber(d.rating, 0),
      deliveries: deliveriesCountByDeliverer.get(d.deliverer_id) || 0,
    };
  });

  const MOCK_STORES = stores.map((s) => ({
    id: s.store_code,
    name: s.name,
    category: capitalize(s.category),
    address: addressById.get(s.address_id) || `Address #${s.address_id}`,
    phone: '-',
    open: '-',
  }));

  const MOCK_PRODUCTS = products.map((p) => ({
    id: String(p.product_id),
    store: storeById.get(p.store_id)?.name || `Store #${p.store_id}`,
    storeId: storeById.get(p.store_id)?.store_code || String(p.store_id),
    name: p.name,
    price: toNumber(p.unit_price, 0),
    active: normalizeProductStatus(p.status) === 'AVAILABLE',
    category: capitalize(storeById.get(p.store_id)?.category || 'General'),
    status: normalizeProductStatus(p.status),
  }));

  const productById = new Map(MOCK_PRODUCTS.map((p) => [Number(p.id), p]));

  const INITIAL_ORDERS = orders.map((o) => {
    const delivery = deliveriesByOrderId.get(o.order_id);
    const delivererCode = delivery ? delivererById.get(delivery.deliverer_id)?.deliverer_code : undefined;
    return {
      id: o.order_code,
      orderId: o.order_id,
      deliveryId: delivery?.delivery_id || null,
      date: dateOnly(o.order_date),
      fee: toNumber(delivery?.delivery_fee, 0),
      bonus: 0,
      adjustment: 0,
      status: paymentOrderIds.has(o.order_id) ? 'Paid' : 'Unpaid',
      customer: customerProfileName(o.customer_id),
      deliverer: delivererCode || '-',
    };
  });

  const INITIAL_EXPENSE_VOUCHERS = vouchers.map((v) => {
    const delivery = deliveries.find((d) => d.delivery_id === v.delivery_id);
    const delivererName = delivery ? delivererProfileName(delivery.deliverer_id) : '-';
    const expenseTypes = Array.isArray(v.expense_items)
      ? [...new Set(v.expense_items.map((x) => x.expense_type).filter(Boolean))].join(', ')
      : '';

    return {
      id: v.voucher_code,
      delivererId: delivery ? delivererById.get(delivery.deliverer_id)?.deliverer_code || '-' : '-',
      delivererName,
      date: dateOnly(v.voucher_date),
      status: String(v.status || '').toUpperCase(),
      total: toNumber(v.total_amount, 0),
      items: expenseTypes || '-',
    };
  });

  const PAYMENT_SUMMARIES = payments.map((payment) => {
    const delivery = deliveryById.get(payment.delivery_id);
    const delivererName = delivery ? delivererProfileName(delivery.deliverer_id) : '-';
    const periodStart = dateOnly(payment.payment_period_start);
    const periodEnd = dateOnly(payment.payment_period_end);
    return {
      id: payment.payment_code,
      period: periodStart && periodEnd ? `${periodStart} to ${periodEnd}` : '-',
      date: dateOnly(payment.payment_datetime),
      deliverer: delivererName,
      status: capitalize(payment.status),
      amount: toNumber(payment.total_payment, 0),
    };
  });

  const MOCK_PREPARED_ORDERS = orders
    .filter((o) => ['PREPARING', 'CONFIRMED', 'PENDING'].includes(String(o.status || '').toUpperCase()))
    .map((o) => ({
      id: o.order_code,
      customer: customerProfileName(o.customer_id),
      store: storeById.get(o.store_id)?.name || `Store #${o.store_id}`,
      time: o.order_date ? `${Math.max(1, Math.floor((Date.now() - new Date(o.order_date).getTime()) / 60000))} mins ago` : '-',
      status: 'Prepared',
    }));

  const now = new Date().toISOString().slice(0, 10);
  const MOCK_PROMOTIONS = promotions.map((p) => ({
    id: p.promotion_code,
    name: p.name,
    store: storeById.get(p.store_id)?.name || `Store #${p.store_id}`,
    storeId: storeById.get(p.store_id)?.store_code || String(p.store_id),
    startDate: dateOnly(p.start_date),
    endDate: dateOnly(p.end_date),
    status: p.start_date <= now && p.end_date >= now ? 'Active' : 'Inactive',
    discountType: p.discount_type,
    revenue: 0,
    products: Array.isArray(p.promotion_items) ? p.promotion_items.length : 0,
    orders: 0,
  }));

  const deliveredOrders = orders.filter((o) => String(o.status || '').toUpperCase() === 'DELIVERED');

  const MOCK_DELIVERED_ORDERS = deliveredOrders.map((o) => {
    const delivery = deliveriesByOrderId.get(o.order_id);
    return {
      id: o.order_code,
      date: dateOnly(o.order_date),
      customer: customerProfileName(o.customer_id),
      store: storeById.get(o.store_id)?.name || `Store #${o.store_id}`,
      total: toNumber(o.total_price, 0),
      deliverer: delivery ? delivererProfileName(delivery.deliverer_id) : '-',
      duration: buildDuration(delivery?.pickup_time, delivery?.delivery_time),
    };
  });

  const firstReceiptOrder = MOCK_DELIVERED_ORDERS[0];
  const firstOrderRaw = firstReceiptOrder
    ? orders.find((o) => o.order_code === firstReceiptOrder.id)
    : orders[0];

  const MOCK_RECEIPT_ITEMS = Array.isArray(firstOrderRaw?.order_items)
    ? firstOrderRaw.order_items.map((item) => {
        const product = productById.get(item.product_id);
        const qty = toNumber(item.quantity, 0);
        const price = toNumber(item.unit_price, 0);
        return {
          id: String(item.product_id),
          name: product?.name || `Product #${item.product_id}`,
          qty,
          price,
          total: toNumber(item.extend_price, qty * price),
        };
      })
    : [];

  const favCountByPair = new Map();
  for (const row of favoriteStores) {
    const key = `${row.customer_code}|${row.store_code}`;
    favCountByPair.set(key, (favCountByPair.get(key) || 0) + 1);
  }

  const MOCK_FAV_STORES = favoriteStores.map((row) => ({
    customer:
      profileById.get(customerByCode.get(row.customer_code)?.profile_id)?.full_name ||
      row.customer_code,
    store: storeByCode.get(row.store_code)?.name || row.store_code,
    orders: favCountByPair.get(`${row.customer_code}|${row.store_code}`) || 1,
  }));

  const productAgg = new Map();
  for (const order of orders) {
    const items = Array.isArray(order.order_items) ? order.order_items : [];
    for (const item of items) {
      const key = item.product_id;
      const product = productById.get(item.product_id);
      if (!product) continue;
      const current = productAgg.get(key) || {
        id: product.id,
        name: product.name,
        store: product.store,
        category: product.category,
        qty: 0,
        revenue: 0,
      };
      current.qty += toNumber(item.quantity, 0);
      current.revenue += toNumber(item.extend_price, 0);
      productAgg.set(key, current);
    }
  }

  const MOCK_TOP_PRODUCTS = [...productAgg.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10)
    .map((p, idx) => ({
      rank: idx + 1,
      store: p.store,
      id: p.id,
      name: p.name,
      category: p.category,
      qty: p.qty,
      revenue: p.revenue,
    }));

  const voucherSum = INITIAL_EXPENSE_VOUCHERS.reduce((acc, v) => acc + toNumber(v.total, 0), 0);
  const MOCK_EXPENSE_SUMMARY_STATS = {
    count: INITIAL_EXPENSE_VOUCHERS.length,
    sum: voucherSum,
    avg: INITIAL_EXPENSE_VOUCHERS.length ? voucherSum / INITIAL_EXPENSE_VOUCHERS.length : 0,
  };

  const delivererAgg = new Map();
  for (const d of deliveries) {
    const deliverer = delivererById.get(d.deliverer_id);
    if (!deliverer) continue;
    const profile = profileById.get(deliverer.profile_id);
    const key = deliverer.deliverer_id;
    const cur = delivererAgg.get(key) || {
      id: deliverer.deliverer_code,
      name: profile?.full_name || deliverer.deliverer_code,
      type: capitalize(deliverer.vehicle_type),
      deliveries: 0,
      earnings: 0,
      rating: toNumber(deliverer.rating, 0),
    };
    cur.deliveries += 1;
    cur.earnings += toNumber(d.delivery_fee, 0);
    delivererAgg.set(key, cur);
  }

  const MOCK_TOP_DELIVERERS = [...delivererAgg.values()]
    .sort((a, b) => b.deliveries - a.deliveries)
    .slice(0, 10)
    .map((d, idx) => ({ rank: idx + 1, ...d }));

  const byMonth = new Map();
  for (const d of deliveries) {
    const day = dateOnly(d.delivery_time || d.pickup_time);
    if (!day) continue;
    const month = day.slice(0, 7) + '-01';
    const cur = byMonth.get(month) || { total: 0, count: 0 };
    cur.total += toNumber(d.delivery_fee, 0);
    cur.count += 1;
    byMonth.set(month, cur);
  }

  const MOCK_REVENUE_PER_TRIP = [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, agg], idx) => ({
      id: idx + 1,
      date: month,
      revenue: agg.count ? Number((agg.total / agg.count).toFixed(2)) : 0,
      notes: 'Average delivery fee (API)',
    }));

  const MOCK_DELIVERER_HISTORY = deliveries
    .map((d) => {
      const order = orderById.get(d.order_id);
      if (!order) return null;
      return {
        id: order.order_code,
        date: dateOnly(d.delivery_time || order.order_date),
        store: storeById.get(order.store_id)?.name || `Store #${order.store_id}`,
        customer: customerProfileName(order.customer_id),
        time: String(d.delivery_time || d.pickup_time || '').slice(11, 16) || '--:--',
        fee: toNumber(d.delivery_fee, 0),
        status: 'Delivered',
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return {
    MOCK_CUSTOMERS,
    MOCK_DELIVERERS,
    MOCK_STORES,
    MOCK_PRODUCTS,
    INITIAL_ORDERS,
    INITIAL_EXPENSE_VOUCHERS,
    MOCK_PREPARED_ORDERS,
    MOCK_PROMOTIONS,
    MOCK_RECEIPT_ITEMS,
    MOCK_TOP_PRODUCTS,
    MOCK_EXPENSE_SUMMARY_STATS,
    MOCK_DELIVERED_ORDERS,
    MOCK_FAV_STORES,
    MOCK_TOP_DELIVERERS,
    MOCK_REVENUE_PER_TRIP,
    MOCK_DELIVERER_HISTORY,
    PAYMENT_SUMMARIES,
  };
}

let DATA = FALLBACK;
try {
  DATA = await loadLiveData();
} catch (error) {
  console.warn('[mockData] API unavailable, using fallback data:', error?.message || error);
}

export const MOCK_CUSTOMERS = DATA.MOCK_CUSTOMERS;
export const MOCK_DELIVERERS = DATA.MOCK_DELIVERERS;
export const MOCK_STORES = DATA.MOCK_STORES;
export const MOCK_PRODUCTS = DATA.MOCK_PRODUCTS;
export const INITIAL_ORDERS = DATA.INITIAL_ORDERS;
export const INITIAL_EXPENSE_VOUCHERS = DATA.INITIAL_EXPENSE_VOUCHERS;
export const MOCK_PREPARED_ORDERS = DATA.MOCK_PREPARED_ORDERS;
export const MOCK_PROMOTIONS = DATA.MOCK_PROMOTIONS;
export const MOCK_RECEIPT_ITEMS = DATA.MOCK_RECEIPT_ITEMS;
export const MOCK_TOP_PRODUCTS = DATA.MOCK_TOP_PRODUCTS;
export const MOCK_EXPENSE_SUMMARY_STATS = DATA.MOCK_EXPENSE_SUMMARY_STATS;
export const MOCK_DELIVERED_ORDERS = DATA.MOCK_DELIVERED_ORDERS;
export const MOCK_FAV_STORES = DATA.MOCK_FAV_STORES;
export const MOCK_TOP_DELIVERERS = DATA.MOCK_TOP_DELIVERERS;
export const MOCK_REVENUE_PER_TRIP = DATA.MOCK_REVENUE_PER_TRIP;
export const MOCK_DELIVERER_HISTORY = DATA.MOCK_DELIVERER_HISTORY;
export const PAYMENT_SUMMARIES = DATA.PAYMENT_SUMMARIES;
