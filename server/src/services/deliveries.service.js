'use strict';
const model = require('../models/deliveries.model');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { schemas } = require('../schemas');

function toFieldErrors(zodError) {
  return zodError.issues.map(issue => ({
    field: `requestBody.${issue.path.join('.')}`,
    reason: issue.message,
  }));
}
const VALID_TYPES = ['STANDARD', 'HURRY', 'EXPRESS', 'SCHEDULED'];

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const result = schemas.deliveryCreate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid delivery input', toFieldErrors(result.error));
  return model.create(data);
};

exports.update = async (id, data) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Delivery ${id} not found`);
  const result = schemas.deliveryUpdate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid delivery input', toFieldErrors(result.error));
  return model.update(id, data);
};

exports.remove = async (id) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Delivery ${id} not found`);
  const used = await model.isReferenced(id);
  if (used) throw new ValidationError(`Delivery ${id} has associated payments or expense vouchers and cannot be deleted`);
  await model.deleteById(id);
  return { message: `Delivery ${id} deleted successfully` };
};
