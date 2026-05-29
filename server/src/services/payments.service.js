'use strict';
const model = require('../models/payments.model');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { schemas } = require('../schemas');

function toFieldErrors(zodError) {
  return zodError.issues.map(issue => ({
    field: `requestBody.${issue.path.join('.')}`,
    reason: issue.message,
  }));
}
const VALID_STATUS_SET = ['PENDING', 'PAID', 'CANCELLED', 'FAILED', 'PROCESSING', 'COMPLETED'];
const MUTABLE = ['PENDING'];

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const result = schemas.paymentCreate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid payment input', toFieldErrors(result.error));
  return model.create(data);
};

exports.update = async (code, data) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Payment ${code} not found`);
  if (existing.status !== 'PENDING')
    throw new ValidationError(`Payment ${code} can only be updated when status is PENDING`);
  const result = schemas.paymentUpdate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid payment input', toFieldErrors(result.error));
  return model.update(existing.payment_id, data);
};

exports.remove = async (code) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Payment ${code} not found`);
  if (existing.status !== 'PENDING')
    throw new ValidationError(`Payment ${code} can only be deleted when status is PENDING`);
  await model.deleteById(existing.payment_id);
  return { message: `Payment ${code} deleted successfully` };
};
