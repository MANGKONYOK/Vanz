'use strict';
const model  = require('../models/deliverers.model');
const { ValidationError, NotFoundError } = require('../utils/errors');
const VALID_STATUS = ['available', 'busy', 'offline'];

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const fe = [];
  if (!data.profile_id)    fe.push({ field: 'requestBody.profile_id',    reason: 'required' });
  if (!data.vehicle_type)  fe.push({ field: 'requestBody.vehicle_type',  reason: 'required' });
  if (!data.license_plate) fe.push({ field: 'requestBody.license_plate', reason: 'required' });
  if (data.current_status && !VALID_STATUS.includes(data.current_status))
    fe.push({ field: 'requestBody.current_status', reason: `must be one of ${VALID_STATUS.join(', ')}` });
  if (fe.length) throw new ValidationError('Invalid deliverer input', fe);
  const profileUsed = await model.isProfileUsed(data.profile_id);
  if (profileUsed) throw new ValidationError('Profile is already linked to another deliverer', [{ field: 'requestBody.profile_id', reason: 'already in use' }]);
  return model.create(data);
};

exports.update = async (code, data) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Deliverer ${code} not found`);
  const fe = [];
  if (data.current_status !== undefined && !VALID_STATUS.includes(data.current_status))
    fe.push({ field: 'requestBody.current_status', reason: `must be one of ${VALID_STATUS.join(', ')}` });
  if (fe.length) throw new ValidationError('Invalid deliverer input', fe);
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
