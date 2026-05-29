'use strict';
const model = require('../models/favorite-stores.model');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { schemas } = require('../schemas');

function toFieldErrors(zodError) {
  return zodError.issues.map(issue => ({
    field: `requestBody.${issue.path.join('.')}`,
    reason: issue.message,
  }));
}

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const result = schemas.favoriteStoreCreate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid input', toFieldErrors(result.error));
  return model.create(data);
};

exports.update = async (customerCode, storeCode, data) => {
  const result = schemas.favoriteStoreUpdate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid input', toFieldErrors(result.error));
  return model.update(customerCode, storeCode, data);
};

exports.remove = async (customerCode, storeCode) => {
  const existing = await model.findOne(customerCode, storeCode);
  if (!existing) throw new NotFoundError(`Favourite store ${customerCode}/${storeCode} not found`);
  await model.deleteOne(customerCode, storeCode);
  return { message: `Favourite store ${customerCode}/${storeCode} deleted successfully` };
};
