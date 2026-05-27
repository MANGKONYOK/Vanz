'use strict';
const model = require('../models/deliveries.model');
const { ValidationError, NotFoundError } = require('../utils/errors');
const VALID_TYPES = ['STANDARD', 'HURRY', 'EXPRESS', 'SCHEDULED'];

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const fe = [];
  if (!data.order_code)     fe.push({ field: 'requestBody.order_code',     reason: 'required' });
  if (!data.deliverer_code) fe.push({ field: 'requestBody.deliverer_code', reason: 'required' });
  if (!data.delivery_type)  fe.push({ field: 'requestBody.delivery_type',  reason: 'required' });
  if (data.delivery_fee === undefined || data.delivery_fee === null)
    fe.push({ field: 'requestBody.delivery_fee', reason: 'required' });
  if (data.delivery_type && !VALID_TYPES.includes(data.delivery_type))
    fe.push({ field: 'requestBody.delivery_type', reason: `must be one of ${VALID_TYPES.join(', ')}` });
  if (data.delivery_fee !== undefined && (isNaN(data.delivery_fee) || Number(data.delivery_fee) < 0))
    fe.push({ field: 'requestBody.delivery_fee', reason: 'must be >= 0' });
  if (fe.length) throw new ValidationError('Invalid delivery input', fe);
  return model.create(data);
};

exports.update = async (id, data) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Delivery ${id} not found`);
  const fe = [];
  if (data.delivery_type !== undefined && !VALID_TYPES.includes(data.delivery_type))
    fe.push({ field: 'requestBody.delivery_type', reason: `must be one of ${VALID_TYPES.join(', ')}` });
  if (data.delivery_fee !== undefined && (isNaN(data.delivery_fee) || Number(data.delivery_fee) < 0))
    fe.push({ field: 'requestBody.delivery_fee', reason: 'must be >= 0' });
  if (fe.length) throw new ValidationError('Invalid delivery input', fe);
  return model.update(id, data);
};

exports.remove = async (id) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Delivery ${id} not found`);
  const used = await model.isReferenced(id);
  if (used) throw new ValidationError(`Delivery ${id} has associated payments or expense vouchers and cannot be deleted`);
  await model.deleteById(id);
  return { message: `Delivery ${id} deleted successfully` };
};
