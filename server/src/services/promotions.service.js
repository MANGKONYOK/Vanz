'use strict';
const model = require('../models/promotions.model');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { schemas } = require('../schemas');

function toFieldErrors(zodError) {
  return zodError.issues.map(issue => ({
    field: `requestBody.${issue.path.join('.')}`,
    reason: issue.message,
  }));
}
const VALID_DISCOUNT = ['PERCENTAGE', 'FIXED_AMOUNT'];

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const result = schemas.promotionCreate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid promotion input', toFieldErrors(result.error));
  return model.create(data);
};

exports.update = async (code, data) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Promotion ${code} not found`);
  const result = schemas.promotionUpdate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid promotion input', toFieldErrors(result.error));
  return model.update(existing.promotion_id, data);
};

exports.remove = async (code) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Promotion ${code} not found`);
  await model.deleteById(existing.promotion_id);
  return { message: `Promotion ${code} deleted successfully` };
};
