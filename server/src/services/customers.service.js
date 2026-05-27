'use strict';
const model  = require('../models/customers.model');
const { ValidationError, NotFoundError } = require('../utils/errors');
const VALID_LEVELS = ['STANDARD', 'GOLD', 'PLATINUM'];

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const fe = [];
  if (!data.profile_id)       fe.push({ field: 'requestBody.profile_id',       reason: 'required' });
  if (!data.address_id)       fe.push({ field: 'requestBody.address_id',       reason: 'required' });
  if (!data.membership_level) fe.push({ field: 'requestBody.membership_level', reason: 'required' });
  if (data.membership_level && !VALID_LEVELS.includes(data.membership_level))
    fe.push({ field: 'requestBody.membership_level', reason: `must be one of ${VALID_LEVELS.join(', ')}` });
  if (fe.length) throw new ValidationError('Invalid customer input', fe);
  const profileUsed = await model.isProfileUsed(data.profile_id);
  if (profileUsed) throw new ValidationError('Profile is already linked to another customer', [{ field: 'requestBody.profile_id', reason: 'already in use' }]);
  return model.create(data);
};

exports.update = async (code, data) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Customer ${code} not found`);
  const fe = [];
  if (data.membership_level !== undefined && !VALID_LEVELS.includes(data.membership_level))
    fe.push({ field: 'requestBody.membership_level', reason: `must be one of ${VALID_LEVELS.join(', ')}` });
  if (fe.length) throw new ValidationError('Invalid customer input', fe);
  return model.update(existing.customer_id, data);
};

exports.remove = async (code) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Customer ${code} not found`);
  const used = await model.hasRelatedData(existing.customer_id);
  if (used) throw new ValidationError(`Customer ${code} has orders, reviews, or favourite stores and cannot be deleted`);
  await model.deleteById(existing.customer_id);
  return { message: `Customer ${code} deleted successfully` };
};
