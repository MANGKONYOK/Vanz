'use strict';
const model = require('../models/reviews.model');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { schemas } = require('../schemas');

function toFieldErrors(zodError) {
  return zodError.issues.map(issue => ({
    field: `requestBody.${issue.path.join('.')}`,
    reason: issue.message,
  }));
}
const VALID_TARGETS = ['STORE', 'DELIVERER'];

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const result = schemas.reviewCreate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid review input', toFieldErrors(result.error));
  return model.create(data);
};

exports.update = async (id, data) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Review ${id} not found`);
  const result = schemas.reviewUpdate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid review input', toFieldErrors(result.error));
  return model.update(id, data);
};

exports.remove = async (id) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Review ${id} not found`);
  await model.deleteById(id);
  return { message: `Review ${id} deleted successfully` };
};
