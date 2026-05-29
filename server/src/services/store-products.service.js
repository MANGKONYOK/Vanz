'use strict';
const model = require('../models/store-products.model');
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
  const result = schemas.storeProductCreate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid store product input', toFieldErrors(result.error));
  return model.create(data);
};

exports.update = async (id, data) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Product ${id} not found`);
  const result = schemas.storeProductUpdate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid store product input', toFieldErrors(result.error));
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
