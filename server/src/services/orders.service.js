'use strict';
const model = require('../models/orders.model');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { schemas } = require('../schemas');

function toFieldErrors(zodError) {
  return zodError.issues.map(issue => ({
    field: `requestBody.${issue.path.join('.')}`,
    reason: issue.message,
  }));
}
const VALID_STATUS = ['PENDING', 'CONFIRMED', 'PREPARING', 'PICKED_UP', 'DELIVERING', 'DELIVERED', 'CANCELLED'];
const MUTABLE_STATUS = ['PENDING', 'CONFIRMED', 'CANCELLED'];

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const result = schemas.orderCreate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid order input', toFieldErrors(result.error));
  return model.create(data);
};

function orderItemsChanged(existingItems, newItems) {
  if (!existingItems || !newItems) return true;
  if (existingItems.length !== newItems.length) return true;
  for (let i = 0; i < newItems.length; i++) {
    const n = newItems[i];
    const ext = existingItems.find(e => String(e.product_id) === String(n.product_id));
    if (!ext) return true;
    if (parseInt(n.quantity) !== parseInt(ext.quantity)) return true;
    if (Math.abs(parseFloat(n.unit_price) - parseFloat(ext.unit_price)) > 0.01) return true;
  }
  return false;
}

exports.update = async (code, data) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Order ${code} not found`);
  
  const statusUpper = existing.status?.toUpperCase();
  if (statusUpper !== 'PENDING') {
    const pool = require('../db/pool');
    const { rows: [custRow] } = await pool.query('SELECT code FROM customer WHERE id = $1', [existing.customer_id]);
    const { rows: [storeRow] } = await pool.query('SELECT code FROM store WHERE id = $1', [existing.store_id]);
    
    const existingCustCode = custRow?.code;
    const existingStoreCode = storeRow?.code;

    const customerChanged = data.customer_code !== undefined && data.customer_code !== existingCustCode;
    const storeChanged = data.store_code !== undefined && data.store_code !== existingStoreCode;
    const addressChanged = data.address_snapshot !== undefined && data.address_snapshot !== existing.address_snapshot;
    const priceChanged = data.total_price !== undefined && Math.abs(parseFloat(data.total_price || 0) - parseFloat(existing.total_price || 0)) > 0.01;
    const itemsChanged = data.order_items !== undefined && orderItemsChanged(existing.order_items, data.order_items);
    
    if (customerChanged || storeChanged || addressChanged || priceChanged || itemsChanged) {
      throw new ValidationError(`Only status can be modified when order status is ${existing.status}`);
    }
  }

  const result = schemas.orderUpdate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid order input', toFieldErrors(result.error));
  return model.update(existing.order_id, data);
};

exports.remove = async (code) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Order ${code} not found`);
  const status = existing.status?.toUpperCase();
  if (status !== 'CANCELLED' && status !== 'COMPLETED') {
    throw new ValidationError(`Order ${code} can only be deleted when status is CANCELLED or COMPLETED`);
  }
  await model.deleteById(existing.order_id);
  return { message: `Order ${code} deleted successfully` };
};
