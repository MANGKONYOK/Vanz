'use strict';
const model = require('../models/profiles.model');
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
  const result = schemas.profileCreate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid profile input', toFieldErrors(result.error));
  return model.create(data);
};

exports.update = async (id, data) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Profile ${id} not found`);
  const result = schemas.profileUpdate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid profile input', toFieldErrors(result.error));
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
