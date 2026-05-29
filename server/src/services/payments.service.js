'use strict';
const model = require('../models/payments.model');
const { ValidationError, NotFoundError } = require('../utils/errors');
const VALID_STATUS_SET = ['pending', 'paid', 'cancelled', 'failed', 'processing', 'completed'];
const MUTABLE = ['pending'];

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const fe = [];
  if (data.delivery_id === undefined || data.delivery_id === null)
    fe.push({ field: 'requestBody.delivery_id', reason: 'required' });
  if (data.delivery_id !== undefined && (isNaN(data.delivery_id) || Number(data.delivery_id) <= 0))
    fe.push({ field: 'requestBody.delivery_id', reason: 'must be a positive integer' });
  if (!data.payment_period_start)   fe.push({ field: 'requestBody.payment_period_start',   reason: 'required' });
  if (!data.payment_period_end)     fe.push({ field: 'requestBody.payment_period_end',     reason: 'required' });
  if (data.total_payment === undefined || data.total_payment === null)
    fe.push({ field: 'requestBody.total_payment', reason: 'required (calculated by frontend)' });
  if (data.total_payment !== undefined && (isNaN(data.total_payment) || Number(data.total_payment) < 0))
    fe.push({ field: 'requestBody.total_payment', reason: 'must be >= 0' });
  if (!data.payment_datetime)
    fe.push({ field: 'requestBody.payment_datetime', reason: 'required' });
  if (!data.payment_items || !Array.isArray(data.payment_items) || data.payment_items.length === 0)
    fe.push({ field: 'requestBody.payment_items', reason: 'must have at least 1 item' });
  if (Array.isArray(data.payment_items)) {
    data.payment_items.forEach((item, i) => {
      if (!item.order_code) fe.push({ field: `requestBody.payment_items[${i}].order_code`, reason: 'required' });
      if (item.delivery_fee === undefined || Number(item.delivery_fee) < 0)
        fe.push({ field: `requestBody.payment_items[${i}].delivery_fee`, reason: 'required, must be >= 0' });
      if (item.bonus === undefined || Number(item.bonus) < 0)
        fe.push({ field: `requestBody.payment_items[${i}].bonus`, reason: 'required, must be >= 0' });
    });
  }
  if (fe.length) throw new ValidationError('Invalid payment input', fe);
  return model.create(data);
};

exports.update = async (code, data) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Payment ${code} not found`);
  if (existing.status !== 'pending')
    throw new ValidationError(`Payment ${code} can only be updated when status is pending`);
  const fe = [];
  if (data.status !== undefined && !['pending', 'paid', 'cancelled'].includes(data.status))
    fe.push({ field: 'requestBody.status', reason: 'must be one of PENDING, PAID, CANCELLED' });
  if (data.total_payment !== undefined && (isNaN(data.total_payment) || Number(data.total_payment) < 0))
    fe.push({ field: 'requestBody.total_payment', reason: 'must be >= 0' });
  if (Array.isArray(data.payment_items)) {
    data.payment_items.forEach((item, i) => {
      if (!item.order_code) fe.push({ field: `requestBody.payment_items[${i}].order_code`, reason: 'required' });
      if (item.delivery_fee === undefined || Number(item.delivery_fee) < 0)
        fe.push({ field: `requestBody.payment_items[${i}].delivery_fee`, reason: 'required, must be >= 0' });
      if (item.bonus === undefined || Number(item.bonus) < 0)
        fe.push({ field: `requestBody.payment_items[${i}].bonus`, reason: 'required, must be >= 0' });
    });
  }
  if (fe.length) throw new ValidationError('Invalid payment input', fe);
  return model.update(existing.payment_id, data);
};

exports.remove = async (code) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Payment ${code} not found`);
  if (existing.status !== 'pending')
    throw new ValidationError(`Payment ${code} can only be deleted when status is pending`);
  await model.deleteById(existing.payment_id);
  return { message: `Payment ${code} deleted successfully` };
};
