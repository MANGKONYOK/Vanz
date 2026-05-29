'use strict';
const model  = require('../models/customers.model');
const { schemas } = require('../schemas');
const { ValidationError, NotFoundError } = require('../utils/errors');

function toFieldErrors(zodError) {
  return zodError.issues.map(issue => ({
    field: `requestBody.${issue.path.join('.')}`,
    reason: issue.message,
  }));
}

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const result = schemas.customerCreate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid customer input', toFieldErrors(result.error));
  const profileUsed = await model.isProfileUsed(data.profile_id);
  if (profileUsed) throw new ValidationError('Profile is already linked to another customer', [{ field: 'requestBody.profile_id', reason: 'already in use' }]);
  return model.create(data);
};

exports.update = async (code, data) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Customer ${code} not found`);
  const result = schemas.customerUpdate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid customer input', toFieldErrors(result.error));
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
