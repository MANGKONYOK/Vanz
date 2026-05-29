'use strict';
const model = require('../models/dispatch-assignments.model');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { schemas } = require('../schemas');

function toFieldErrors(zodError) {
  return zodError.issues.map(issue => ({
    field: `requestBody.${issue.path.join('.')}`,
    reason: issue.message,
  }));
}
const VALID_STATUS = ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'];

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const result = schemas.dispatchAssignmentCreate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid dispatch assignment input', toFieldErrors(result.error));
  return model.create(data);
};

exports.update = async (id, data) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Dispatch Assignment ${id} not found`);
  const result = schemas.dispatchAssignmentUpdate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid dispatch assignment input', toFieldErrors(result.error));
  return model.update(id, data);
};

exports.remove = async (id) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Dispatch Assignment ${id} not found`);
  if (existing.status !== 'PENDING')
    throw new ValidationError(`Dispatch Assignment ${id} can only be deleted when status is PENDING`);
  await model.deleteById(id);
  return { message: `Dispatch Assignment ${id} deleted successfully` };
};
