'use strict';
const model = require('../models/reviews.model');
const { ValidationError, NotFoundError } = require('../utils/errors');
const VALID_TARGETS = ['STORE', 'DELIVERER'];

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const fe = [];
  if (!data.order_code)    fe.push({ field: 'requestBody.order_code',    reason: 'required' });
  if (!data.customer_code) fe.push({ field: 'requestBody.customer_code', reason: 'required' });
  if (data.rating === undefined || data.rating === null)
    fe.push({ field: 'requestBody.rating', reason: 'required' });
  if (!data.target) fe.push({ field: 'requestBody.target', reason: 'required' });
  if (data.rating !== undefined && (isNaN(data.rating) || Number(data.rating) < 1 || Number(data.rating) > 5))
    fe.push({ field: 'requestBody.rating', reason: 'must be between 1 and 5' });
  if (data.target && !VALID_TARGETS.includes(data.target))
    fe.push({ field: 'requestBody.target', reason: `must be one of ${VALID_TARGETS.join(', ')}` });
  if (fe.length) throw new ValidationError('Invalid review input', fe);
  return model.create(data);
};

exports.update = async (id, data) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Review ${id} not found`);
  const fe = [];
  if (data.rating !== undefined && (isNaN(data.rating) || Number(data.rating) < 1 || Number(data.rating) > 5))
    fe.push({ field: 'requestBody.rating', reason: 'must be between 1 and 5' });
  if (data.target !== undefined && !VALID_TARGETS.includes(data.target))
    fe.push({ field: 'requestBody.target', reason: `must be one of ${VALID_TARGETS.join(', ')}` });
  if (fe.length) throw new ValidationError('Invalid review input', fe);
  return model.update(id, data);
};

exports.remove = async (id) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Review ${id} not found`);
  await model.deleteById(id);
  return { message: `Review ${id} deleted successfully` };
};
