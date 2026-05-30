'use strict';
const model = require('../models/orders.model');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { schemas } = require('../schemas');

function toFieldErrors(zodError) {
  return zodError.issues.map(issue => ({
    field: `requestBody.${issue.path.join('.')}`,
    reason: issue.message,
  }));
}
const VALID_STATUS = ['PENDING', 'CONFIRMED', 'PREPARING', 'PICKED_UP', 'DELIVERING', 'DELIVERED', 'CANCELLED'];
const MUTABLE_STATUS = ['PENDING', 'CONFIRMED', 'CANCELLED'];

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const result = schemas.orderCreate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid order input', toFieldErrors(result.error));
  return model.create(data);
};

exports.update = async (code, data) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Order ${code} not found`);
  const result = schemas.orderUpdate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid order input', toFieldErrors(result.error));
  return model.update(existing.order_id, data);
};

exports.remove = async (code) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Order ${code} not found`);
  if (existing.status?.toUpperCase() !== 'PENDING')
    throw new ValidationError(`Order ${code} can only be deleted when status is PENDING`);
  await model.deleteById(existing.order_id);
  return { message: `Order ${code} deleted successfully` };
};
