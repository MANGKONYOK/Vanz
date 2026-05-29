'use strict';
const model = require('../models/stores.model');
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
  const result = schemas.storeCreate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid store input', toFieldErrors(result.error));
  return model.create(data);
};

exports.update = async (code, data) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Store ${code} not found`);
  const result = schemas.storeUpdate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid store input', toFieldErrors(result.error));
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
