'use strict';
const model = require('../models/store-products.model');
const { ValidationError, NotFoundError } = require('../utils/errors');
const VALID_STATUS = ['available', 'out_of_stock', 'discontinued', 'unavailable'];

function normalizeStatus(value) {
  if (value === undefined || value === null) return value;
  return String(value).trim().toLowerCase();
}

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const payload = {
    ...data,
    status: normalizeStatus(data.status),
  };
  const fe = [];
  if (!payload.store_code) fe.push({ field: 'requestBody.store_code', reason: 'required' });
  if (!payload.name)       fe.push({ field: 'requestBody.name',       reason: 'required' });
  if (payload.unit_price === undefined || payload.unit_price === null)
    fe.push({ field: 'requestBody.unit_price', reason: 'required' });
  if (payload.unit_price !== undefined && (isNaN(payload.unit_price) || Number(payload.unit_price) < 0))
    fe.push({ field: 'requestBody.unit_price', reason: 'must be >= 0' });
  if (payload.status && !VALID_STATUS.includes(payload.status))
    fe.push({ field: 'requestBody.status', reason: `must be one of ${VALID_STATUS.join(', ')}` });
  if (fe.length) throw new ValidationError('Invalid store product input', fe);
  return model.create(payload);
};

exports.update = async (id, data) => {
  const payload = {
    ...data,
    status: normalizeStatus(data.status),
  };
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Product ${id} not found`);
  const fe = [];
  if (payload.unit_price !== undefined && (isNaN(payload.unit_price) || Number(payload.unit_price) < 0))
    fe.push({ field: 'requestBody.unit_price', reason: 'must be >= 0' });
  if (payload.status !== undefined && !VALID_STATUS.includes(payload.status))
    fe.push({ field: 'requestBody.status', reason: `must be one of ${VALID_STATUS.join(', ')}` });
  if (fe.length) throw new ValidationError('Invalid store product input', fe);
  return model.update(id, payload);
};

exports.remove = async (id) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Product ${id} not found`);
  const used = await model.isReferenced(id);
  if (used) throw new ValidationError(`Product ${id} is referenced by an order item or promotion item and cannot be deleted`);
  await model.deleteById(id);
  return { message: `Product ${id} deleted successfully` };
};
