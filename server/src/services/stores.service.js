'use strict';
const model = require('../models/stores.model');
const { ValidationError, NotFoundError } = require('../utils/errors');
const VALID_STATUS = ['active', 'inactive', 'suspended'];

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const fe = [];
  if (!data.name)       fe.push({ field: 'requestBody.name',       reason: 'required' });
  if (!data.address_id) fe.push({ field: 'requestBody.address_id', reason: 'required' });
  if (!data.category)   fe.push({ field: 'requestBody.category',   reason: 'required' });
  if (data.status && !VALID_STATUS.includes(data.status))
    fe.push({ field: 'requestBody.status', reason: `must be one of ${VALID_STATUS.join(', ')}` });
  if (fe.length) throw new ValidationError('Invalid store input', fe);
  return model.create(data);
};

exports.update = async (code, data) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Store ${code} not found`);
  const fe = [];
  if (data.status !== undefined && !VALID_STATUS.includes(data.status))
    fe.push({ field: 'requestBody.status', reason: `must be one of ${VALID_STATUS.join(', ')}` });
  if (fe.length) throw new ValidationError('Invalid store input', fe);
  return model.update(existing.store_id, data);
};

exports.remove = async (code) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Store ${code} not found`);
  const used = await model.hasRelatedData(existing.store_id);
  if (used) throw new ValidationError(`Store ${code} has products, promotions, favourite stores, or orders and cannot be deleted`);
  await model.deleteById(existing.store_id);
  return { message: `Store ${code} deleted successfully` };
};
