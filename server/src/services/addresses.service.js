'use strict';
const model = require('../models/addresses.model');
const { ValidationError, NotFoundError } = require('../utils/errors');

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const fe = [];
  if (!data.address_name)   fe.push({ field: 'requestBody.address_name',   reason: 'required' });
  if (!data.address_type)   fe.push({ field: 'requestBody.address_type',   reason: 'required' });
  if (!data.address_line_1) fe.push({ field: 'requestBody.address_line_1', reason: 'required' });
  if (!data.city)           fe.push({ field: 'requestBody.city',           reason: 'required' });
  if (!data.country_code)   fe.push({ field: 'requestBody.country_code',   reason: 'required' });
  if (data.country_code && data.country_code.length !== 2)
    fe.push({ field: 'requestBody.country_code', reason: 'must be 2 characters (ISO 3166-1 alpha-2)' });
  if (data.latitude  !== undefined && (isNaN(data.latitude)  || data.latitude  < -90  || data.latitude  > 90))
    fe.push({ field: 'requestBody.latitude',  reason: 'must be between -90 and 90' });
  if (data.longitude !== undefined && (isNaN(data.longitude) || data.longitude < -180 || data.longitude > 180))
    fe.push({ field: 'requestBody.longitude', reason: 'must be between -180 and 180' });
  if (fe.length) throw new ValidationError('Invalid address input', fe);
  return model.create(data);
};

exports.update = async (id, data) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Address ${id} not found`);
  const fe = [];
  if (data.country_code !== undefined && data.country_code.length !== 2)
    fe.push({ field: 'requestBody.country_code', reason: 'must be 2 characters' });
  if (data.latitude  !== undefined && (isNaN(data.latitude)  || data.latitude  < -90  || data.latitude  > 90))
    fe.push({ field: 'requestBody.latitude',  reason: 'must be between -90 and 90' });
  if (data.longitude !== undefined && (isNaN(data.longitude) || data.longitude < -180 || data.longitude > 180))
    fe.push({ field: 'requestBody.longitude', reason: 'must be between -180 and 180' });
  if (fe.length) throw new ValidationError('Invalid address input', fe);
  return model.update(id, data);
};

exports.remove = async (id) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Address ${id} not found`);
  const used = await model.isReferenced(id);
  if (used) throw new ValidationError(`Address ${id} is referenced by a customer or store and cannot be deleted`);
  await model.deleteById(id);
  return { message: `Address ${id} deleted successfully` };
};
