'use strict';
const model = require('../models/delivery-location-logs.model');
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
  const result = schemas.deliveryLocationLogCreate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid location log input', toFieldErrors(result.error));
  return model.create(data);
};

exports.update = async (id, data) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Delivery Location Log ${id} not found`);
  const result = schemas.deliveryLocationLogUpdate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid location log input', toFieldErrors(result.error));
  return model.update(id, data);
};

exports.remove = async (id) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Delivery Location Log ${id} not found`);
  await model.deleteById(id);
  return { message: `Delivery Location Log ${id} deleted successfully` };
};
