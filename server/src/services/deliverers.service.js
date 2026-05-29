'use strict';
const model  = require('../models/deliverers.model');
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
  const result = schemas.delivererCreate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid deliverer input', toFieldErrors(result.error));
  const profileUsed = await model.isProfileUsed(data.profile_id);
  if (profileUsed) throw new ValidationError('Profile is already linked to another deliverer', [{ field: 'requestBody.profile_id', reason: 'already in use' }]);
  return model.create(data);
};

exports.update = async (code, data) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Deliverer ${code} not found`);
  const result = schemas.delivererUpdate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid deliverer input', toFieldErrors(result.error));
  return model.update(existing.deliverer_id, data);
};

exports.remove = async (code) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Deliverer ${code} not found`);
  const used = await model.hasRelatedData(existing.deliverer_id);
  if (used) throw new ValidationError(`Deliverer ${code} has deliveries, assignments, payments, or expense vouchers and cannot be deleted`);
  await model.deleteById(existing.deliverer_id);
  return { message: `Deliverer ${code} deleted successfully` };
};
