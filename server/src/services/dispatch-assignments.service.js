'use strict';
const model = require('../models/dispatch-assignments.model');
const { ValidationError, NotFoundError } = require('../utils/errors');
const VALID_STATUS = ['pending', 'accepted', 'rejected', 'expired'];

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const fe = [];
  if (!data.order_code)     fe.push({ field: 'requestBody.order_code',     reason: 'required' });
  if (!data.deliverer_code) fe.push({ field: 'requestBody.deliverer_code', reason: 'required' });
  if (fe.length) throw new ValidationError('Invalid dispatch assignment input', fe);
  return model.create(data);
};

exports.update = async (id, data) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Dispatch Assignment ${id} not found`);
  const fe = [];
  if (!data.status) fe.push({ field: 'requestBody.status', reason: 'required' });
  if (data.status && !VALID_STATUS.includes(data.status))
    fe.push({ field: 'requestBody.status', reason: `must be one of ${VALID_STATUS.join(', ')}` });
  if (fe.length) throw new ValidationError('Invalid dispatch assignment input', fe);
  return model.update(id, data);
};

exports.remove = async (id) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Dispatch Assignment ${id} not found`);
  if (existing.status !== 'pending')
    throw new ValidationError(`Dispatch Assignment ${id} can only be deleted when status is pending`);
  await model.deleteById(id);
  return { message: `Dispatch Assignment ${id} deleted successfully` };
};
