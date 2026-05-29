'use strict';
const model = require('../models/addresses.model');
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
  const result = schemas.addressCreate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid address input', toFieldErrors(result.error));
  return model.create(data);
};

exports.update = async (id, data) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Address ${id} not found`);
  const result = schemas.addressUpdate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid address input', toFieldErrors(result.error));
  return model.update(id, data);
};

exports.remove = async (id) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Address ${id} not found`);
  const used = await model.isReferenced(id);
  if (used) throw new ValidationError(`Address ${id} is referenced by a customer or store and cannot be deleted`);
  await model.deleteById(id);
  return { message: `Address ${id} deleted successfully` };
};
