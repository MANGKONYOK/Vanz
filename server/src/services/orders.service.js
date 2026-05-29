'use strict';
const model = require('../models/orders.model');
const { ValidationError, NotFoundError } = require('../utils/errors');
const VALID_STATUS = ['pending', 'confirmed', 'preparing', 'picked_up', 'delivering', 'delivered', 'cancelled'];
const MUTABLE_STATUS = ['pending', 'confirmed', 'cancelled'];

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const fe = [];
  if (!data.customer_code)   fe.push({ field: 'requestBody.customer_code',   reason: 'required' });
  if (!data.store_code)      fe.push({ field: 'requestBody.store_code',      reason: 'required' });
  if (!data.address_snapshot)fe.push({ field: 'requestBody.address_snapshot',reason: 'required' });
  if (data.total_price === undefined || data.total_price === null)
    fe.push({ field: 'requestBody.total_price', reason: 'required (calculated by frontend)' });
  if (data.total_price !== undefined && (isNaN(data.total_price) || Number(data.total_price) < 0))
    fe.push({ field: 'requestBody.total_price', reason: 'must be >= 0' });
  if (!data.order_items || !Array.isArray(data.order_items) || data.order_items.length === 0)
    fe.push({ field: 'requestBody.order_items', reason: 'must have at least 1 item' });
  if (Array.isArray(data.order_items)) {
    data.order_items.forEach((item, i) => {
      if (!item.product_id) fe.push({ field: `requestBody.order_items[${i}].product_id`, reason: 'required' });
      if (item.quantity === undefined || item.quantity === null || Number(item.quantity) <= 0)
        fe.push({ field: `requestBody.order_items[${i}].quantity`, reason: 'must be > 0' });
      if (item.unit_price === undefined || item.unit_price === null || Number(item.unit_price) < 0)
        fe.push({ field: `requestBody.order_items[${i}].unit_price`, reason: 'required, must be >= 0' });
      if (item.extend_price === undefined || item.extend_price === null || Number(item.extend_price) < 0)
        fe.push({ field: `requestBody.order_items[${i}].extend_price`, reason: 'required (calculated by frontend), must be >= 0' });
    });
  }
  if (fe.length) throw new ValidationError('Invalid order input', fe);
  return model.create(data);
};

exports.update = async (code, data) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Order ${code} not found`);
  const fe = [];
  if (data.status !== undefined && !MUTABLE_STATUS.includes(data.status))
    fe.push({ field: 'requestBody.status', reason: `must be one of ${MUTABLE_STATUS.join(', ')}` });
  if (data.address_snapshot !== undefined && existing.status !== 'pending')
    fe.push({ field: 'requestBody.address_snapshot', reason: 'can only be updated when order status is PENDING' });
  if (data.total_price !== undefined && (isNaN(data.total_price) || Number(data.total_price) < 0))
    fe.push({ field: 'requestBody.total_price', reason: 'must be >= 0' });
  if (Array.isArray(data.order_items)) {
    data.order_items.forEach((item, i) => {
      if (!item.product_id) fe.push({ field: `requestBody.order_items[${i}].product_id`, reason: 'required' });
      if (item.quantity === undefined || Number(item.quantity) <= 0)
        fe.push({ field: `requestBody.order_items[${i}].quantity`, reason: 'must be > 0' });
      if (item.extend_price === undefined || Number(item.extend_price) < 0)
        fe.push({ field: `requestBody.order_items[${i}].extend_price`, reason: 'required, must be >= 0' });
    });
  }
  if (fe.length) throw new ValidationError('Invalid order input', fe);
  return model.update(existing.order_id, data);
};

exports.remove = async (code) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Order ${code} not found`);
  if (existing.status !== 'pending')
    throw new ValidationError(`Order ${code} can only be deleted when status is pending`);
  await model.deleteById(existing.order_id);
  return { message: `Order ${code} deleted successfully` };
};
