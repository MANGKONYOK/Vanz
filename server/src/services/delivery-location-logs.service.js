'use strict';
const model = require('../models/delivery-location-logs.model');
const { ValidationError, NotFoundError } = require('../utils/errors');

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const fe = [];
  if (!data.deliverer_code) fe.push({ field: 'requestBody.deliverer_code', reason: 'required' });
  if (data.latitude  === undefined) fe.push({ field: 'requestBody.latitude',  reason: 'required' });
  if (data.longitude === undefined) fe.push({ field: 'requestBody.longitude', reason: 'required' });
  if (data.latitude  !== undefined && (isNaN(data.latitude)  || data.latitude  < -90  || data.latitude  > 90))
    fe.push({ field: 'requestBody.latitude',  reason: 'must be between -90 and 90' });
  if (data.longitude !== undefined && (isNaN(data.longitude) || data.longitude < -180 || data.longitude > 180))
    fe.push({ field: 'requestBody.longitude', reason: 'must be between -180 and 180' });
  if (fe.length) throw new ValidationError('Invalid location log input', fe);
  return model.create(data);
};

exports.update = async (id, data) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Delivery Location Log ${id} not found`);
  const fe = [];
  if (data.latitude  !== undefined && (isNaN(data.latitude)  || data.latitude  < -90  || data.latitude  > 90))
    fe.push({ field: 'requestBody.latitude',  reason: 'must be between -90 and 90' });
  if (data.longitude !== undefined && (isNaN(data.longitude) || data.longitude < -180 || data.longitude > 180))
    fe.push({ field: 'requestBody.longitude', reason: 'must be between -180 and 180' });
  if (fe.length) throw new ValidationError('Invalid location log input', fe);
  return model.update(id, data);
};

exports.remove = async (id) => {
  const existing = await model.findById(id);
  if (!existing) throw new NotFoundError(`Delivery Location Log ${id} not found`);
  await model.deleteById(id);
  return { message: `Delivery Location Log ${id} deleted successfully` };
};
