'use strict';
const service = require('../services/deliveries.service');
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
    const id = req.params.delivery_id;
    return success(res, await service.update(id, req.body));
  } catch (e) { return handleError(res, e); }
};

exports.remove = async (req, res) => {
  try {
    const id = req.params.delivery_id;
    return success(res, await service.remove(id));
  } catch (e) { return handleError(res, e); }
};
