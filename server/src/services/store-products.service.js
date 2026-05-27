'use strict';
const model = require('../models/store-products.model');
const { ValidationError, NotFoundError } = require('../utils/errors');
const VALID_STATUS = ['AVAILABLE', 'OUT_OF_STOCK', 'DISCONTINUED', 'UNAVAILABLE'];

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const fe = [];
  if (!data.store_code) fe.push({ field: 'requestBody.store_code', reason: 'required' });
  if (!data.name)       fe.push({ field: 'requestBody.name',       reason: 'required' });
  if (data.unit_price === undefined || data.unit_price === null)
    fe.push({ field: 'requestBody.unit_price', reason: 'required' });
  if (data.unit_price !== undefined && (isNaN(data.unit_price) || Number(data.unit_price) < 0))
    fe.push({ field: 'requestBody.unit_price', reason: 'must be >= 0' });
  if (data.status && !VALID_STATUS.includes(data.status))
    fe.push({ field: 'requestBody.status', reason: `must be one of ${VALID_STATUS.join(', ')}` });
  if (fe.length) throw new ValidationError('Invalid store product input', fe);
  return model.create(data);
};

exports.update = async (id, data) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Product ${id} not found`);
  const fe = [];
  if (data.unit_price !== undefined && (isNaN(data.unit_price) || Number(data.unit_price) < 0))
    fe.push({ field: 'requestBody.unit_price', reason: 'must be >= 0' });
  if (data.status !== undefined && !VALID_STATUS.includes(data.status))
    fe.push({ field: 'requestBody.status', reason: `must be one of ${VALID_STATUS.join(', ')}` });
  if (fe.length) throw new ValidationError('Invalid store product input', fe);
  return model.update(id, data);
};

exports.remove = async (id) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Product ${id} not found`);
  const used = await model.isReferenced(id);
  if (used) throw new ValidationError(`Product ${id} is referenced by an order item or promotion item and cannot be deleted`);
  await model.deleteById(id);
  return { message: `Product ${id} deleted successfully` };
};
