'use strict';
const model = require('../models/profiles.model');
const { ValidationError, NotFoundError } = require('../utils/errors');

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const fe = [];
  if (!data.full_name) fe.push({ field: 'requestBody.full_name', reason: 'required' });
  if (!data.phone)     fe.push({ field: 'requestBody.phone',     reason: 'required' });
  if (!data.email)     fe.push({ field: 'requestBody.email',     reason: 'required' });
  if (data.email && !/^[^@]+@[^@]+\.[^@]+$/.test(data.email))
    fe.push({ field: 'requestBody.email', reason: 'must be a valid email address' });
  if (fe.length) throw new ValidationError('Invalid profile input', fe);
  return model.create(data);
};

exports.update = async (id, data) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Profile ${id} not found`);
  const fe = [];
  if (data.email !== undefined && !/^[^@]+@[^@]+\.[^@]+$/.test(data.email))
    fe.push({ field: 'requestBody.email', reason: 'must be a valid email address' });
  if (fe.length) throw new ValidationError('Invalid profile input', fe);
  return model.update(id, data);
};

exports.remove = async (id) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Profile ${id} not found`);
  const used = await model.isReferenced(id);
  if (used) throw new ValidationError(`Profile ${id} is referenced by a customer or deliverer and cannot be deleted`);
  await model.deleteById(id);
  return { message: `Profile ${id} deleted successfully` };
};
