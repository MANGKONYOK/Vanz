'use strict';
const model = require('../models/promotions.model');
const { ValidationError, NotFoundError } = require('../utils/errors');
const VALID_DISCOUNT = ['PERCENTAGE', 'FIXED_AMOUNT'];

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const fe = [];
  if (!data.store_code)    fe.push({ field: 'requestBody.store_code',    reason: 'required' });
  if (!data.name)          fe.push({ field: 'requestBody.name',          reason: 'required' });
  if (!data.start_date)    fe.push({ field: 'requestBody.start_date',    reason: 'required' });
  if (!data.end_date)      fe.push({ field: 'requestBody.end_date',      reason: 'required' });
  if (!data.discount_type) fe.push({ field: 'requestBody.discount_type', reason: 'required' });
  if (data.discount_type && !VALID_DISCOUNT.includes(data.discount_type))
    fe.push({ field: 'requestBody.discount_type', reason: `must be one of ${VALID_DISCOUNT.join(', ')}` });
  if (data.start_date && data.end_date && new Date(data.end_date) < new Date(data.start_date))
    fe.push({ field: 'requestBody.end_date', reason: 'must be >= start_date' });
  if (!data.promotion_items || !Array.isArray(data.promotion_items) || data.promotion_items.length === 0)
    fe.push({ field: 'requestBody.promotion_items', reason: 'must have at least 1 item' });
  if (Array.isArray(data.promotion_items)) {
    data.promotion_items.forEach((item, i) => {
      if (!item.product_id) fe.push({ field: `requestBody.promotion_items[${i}].product_id`, reason: 'required' });
      if (item.discount_value === undefined || Number(item.discount_value) <= 0)
        fe.push({ field: `requestBody.promotion_items[${i}].discount_value`, reason: 'must be > 0' });
      if (data.discount_type === 'PERCENTAGE' && item.discount_value !== undefined && Number(item.discount_value) > 100)
        fe.push({ field: `requestBody.promotion_items[${i}].discount_value`, reason: 'percentage must be <= 100' });
    });
  }
  if (fe.length) throw new ValidationError('Invalid promotion input', fe);
  return model.create(data);
};

exports.update = async (code, data) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Promotion ${code} not found`);
  const fe = [];
  if (data.discount_type !== undefined && !VALID_DISCOUNT.includes(data.discount_type))
    fe.push({ field: 'requestBody.discount_type', reason: `must be one of ${VALID_DISCOUNT.join(', ')}` });
  const discountType = data.discount_type || existing.discount_type;
  if (Array.isArray(data.promotion_items)) {
    data.promotion_items.forEach((item, i) => {
      if (!item.product_id) fe.push({ field: `requestBody.promotion_items[${i}].product_id`, reason: 'required' });
      if (item.discount_value === undefined || Number(item.discount_value) <= 0)
        fe.push({ field: `requestBody.promotion_items[${i}].discount_value`, reason: 'must be > 0' });
      if (discountType === 'PERCENTAGE' && item.discount_value !== undefined && Number(item.discount_value) > 100)
        fe.push({ field: `requestBody.promotion_items[${i}].discount_value`, reason: 'percentage must be <= 100' });
    });
  }
  if (fe.length) throw new ValidationError('Invalid promotion input', fe);
  return model.update(existing.promotion_id, data);
};

exports.remove = async (code) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Promotion ${code} not found`);
  await model.deleteById(existing.promotion_id);
  return { message: `Promotion ${code} deleted successfully` };
};
