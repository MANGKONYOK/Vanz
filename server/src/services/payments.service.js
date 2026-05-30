'use strict';
const model = require('../models/payments.model');
const pool = require('../db/pool');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { schemas } = require('../schemas');

function toFieldErrors(zodError) {
  return zodError.issues.map(issue => ({
    field: `requestBody.${issue.path.join('.')}`,
    reason: issue.message,
  }));
}

async function paymentItemsChanged(existingItems, newItems) {
  if (!existingItems || !newItems) return true;
  if (existingItems.length !== newItems.length) return true;
  
  const orderIds = existingItems.map(item => item.order_id);
  if (orderIds.length === 0) return false;
  
  const { rows } = await pool.query('SELECT id, code FROM "order" WHERE id = ANY($1)', [orderIds]);
  const orderCodeMap = new Map(rows.map(r => [String(r.id), r.code]));

  for (let i = 0; i < newItems.length; i++) {
    const n = newItems[i];
    const ext = existingItems[i];
    if (!ext) return true;

    const resolvedCode = orderCodeMap.get(String(ext.order_id));
    if (n.order_code !== resolvedCode) return true;
    if (Math.abs(parseFloat(n.delivery_fee) - parseFloat(ext.delivery_fee)) > 0.01) return true;
    if (Math.abs(parseFloat(n.bonus) - parseFloat(ext.bonus)) > 0.01) return true;
    if (Math.abs(parseFloat(n.adjustment_amount || 0) - parseFloat(ext.adjustment_amount || 0)) > 0.01) return true;
  }
  return false;
}

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const result = schemas.paymentCreate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid payment input', toFieldErrors(result.error));
  return model.create(data);
};

exports.update = async (code, data) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Payment ${code} not found`);
  
  const statusUpper = existing.status?.toUpperCase();
  if (statusUpper !== 'PENDING') {
    const startChanged = data.payment_period_start !== undefined && data.payment_period_start !== existing.payment_period_start;
    const endChanged = data.payment_period_end !== undefined && data.payment_period_end !== existing.payment_period_end;
    const totalChanged = data.total_payment !== undefined && Math.abs(parseFloat(data.total_payment || 0) - parseFloat(existing.total_payment || 0)) > 0.01;
    const itemsChanged = data.payment_items !== undefined && await paymentItemsChanged(existing.payment_items, data.payment_items);
    
    if (startChanged || endChanged || totalChanged || itemsChanged) {
      throw new ValidationError(`Only status can be modified when payment status is ${existing.status}`);
    }
  }

  const result = schemas.paymentUpdate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid payment input', toFieldErrors(result.error));
  return model.update(existing.payment_id, data);
};

exports.remove = async (code) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Payment ${code} not found`);
  const status = existing.status?.toUpperCase();
  if (status !== 'PENDING' && status !== 'CANCELLED' && status !== 'COMPLETED' && status !== 'FAILED') {
    throw new ValidationError(`Payment ${code} can only be deleted when status is PENDING, CANCELLED, COMPLETED, or FAILED`);
  }
  await model.deleteById(existing.payment_id);
  return { message: `Payment ${code} deleted successfully` };
};
