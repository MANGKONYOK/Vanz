'use strict';
const service = require('../services/favorite-stores.service');
const { success, handleError } = require('../utils/response');

exports.list = async (req, res) => {
  try { return success(res, await service.list(req.query)); }
  catch (e) { return handleError(res, e); }
};

exports.create = async (req, res) => {
  try { return success(res, await service.create(req.body), 201); }
  catch (e) { return handleError(res, e); }
};

exports.update = async (req, res) => {
  try {
    const { customer_code, store_code } = req.params;
    return success(res, await service.update(customer_code, store_code, req.body));
  } catch (e) { return handleError(res, e); }
};

exports.remove = async (req, res) => {
  try {
    const { customer_code, store_code } = req.params;
    return success(res, await service.remove(customer_code, store_code));
  } catch (e) { return handleError(res, e); }
};
