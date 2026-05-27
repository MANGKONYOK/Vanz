'use strict';
const model = require('../models/favorite-stores.model');
const { ValidationError, NotFoundError } = require('../utils/errors');

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const fe = [];
  if (!data.customer_code) fe.push({ field: 'requestBody.customer_code', reason: 'required' });
  if (!data.store_code)    fe.push({ field: 'requestBody.store_code',    reason: 'required' });
  if (fe.length) throw new ValidationError('Invalid input', fe);
  return model.create(data);
};

exports.update = async (customerCode, storeCode, data) => {
  const fe = [];
  if (!data.new_customer_code) fe.push({ field: 'requestBody.new_customer_code', reason: 'required' });
  if (!data.new_store_code)    fe.push({ field: 'requestBody.new_store_code',    reason: 'required' });
  if (fe.length) throw new ValidationError('Invalid input', fe);
  return model.update(customerCode, storeCode, data);
};

exports.remove = async (customerCode, storeCode) => {
  const existing = await model.findOne(customerCode, storeCode);
  if (!existing) throw new NotFoundError(`Favourite store ${customerCode}/${storeCode} not found`);
  await model.deleteOne(customerCode, storeCode);
  return { message: `Favourite store ${customerCode}/${storeCode} deleted successfully` };
};
