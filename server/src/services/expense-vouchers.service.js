'use strict';
const model = require('../models/expense-vouchers.model');
const { ValidationError, NotFoundError } = require('../utils/errors');
const VALID_TYPES = ['FUEL', 'MAINTENANCE', 'TOLL', 'OTHER'];

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const fe = [];
  if (data.delivery_id === undefined || data.delivery_id === null)
    fe.push({ field: 'requestBody.delivery_id', reason: 'required' });
  if (data.delivery_id !== undefined && (isNaN(data.delivery_id) || Number(data.delivery_id) <= 0))
    fe.push({ field: 'requestBody.delivery_id', reason: 'must be a positive integer' });
  if (!data.voucher_date)  fe.push({ field: 'requestBody.voucher_date',  reason: 'required' });
  if (data.total_amount === undefined || data.total_amount === null)
    fe.push({ field: 'requestBody.total_amount', reason: 'required (calculated by frontend)' });
  if (data.voucher_date && new Date(data.voucher_date) > new Date())
    fe.push({ field: 'requestBody.voucher_date', reason: 'cannot be a future date' });
  if (!data.expense_items || !Array.isArray(data.expense_items) || data.expense_items.length === 0)
    fe.push({ field: 'requestBody.expense_items', reason: 'must have at least 1 item' });
  if (Array.isArray(data.expense_items)) {
    data.expense_items.forEach((item, i) => {
      if (!item.expense_type) fe.push({ field: `requestBody.expense_items[${i}].expense_type`, reason: 'required' });
      if (!item.description)  fe.push({ field: `requestBody.expense_items[${i}].description`,  reason: 'required' });
      if (item.expense_type && !VALID_TYPES.includes(item.expense_type))
        fe.push({ field: `requestBody.expense_items[${i}].expense_type`, reason: `must be one of ${VALID_TYPES.join(', ')}` });
      if (item.amount === undefined || Number(item.amount) <= 0)
        fe.push({ field: `requestBody.expense_items[${i}].amount`, reason: 'must be > 0' });
    });
  }
  if (fe.length) throw new ValidationError('Invalid expense voucher input', fe);
  return model.create(data);
};

exports.update = async (code, data) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Expense Voucher ${code} not found`);
  if (existing.status !== 'DRAFT')
    throw new ValidationError(`Expense Voucher ${code} can only be updated when status is DRAFT`);
  const fe = [];
  if (data.status !== undefined && !['DRAFT', 'SUBMITTED'].includes(data.status))
    fe.push({ field: 'requestBody.status', reason: 'must be one of DRAFT, SUBMITTED' });
  if (data.voucher_date !== undefined && new Date(data.voucher_date) > new Date())
    fe.push({ field: 'requestBody.voucher_date', reason: 'cannot be a future date' });
  if (data.total_amount !== undefined && (isNaN(data.total_amount) || Number(data.total_amount) < 0))
    fe.push({ field: 'requestBody.total_amount', reason: 'must be >= 0' });
  if (Array.isArray(data.expense_items)) {
    data.expense_items.forEach((item, i) => {
      if (!item.expense_type) fe.push({ field: `requestBody.expense_items[${i}].expense_type`, reason: 'required' });
      if (!item.description)  fe.push({ field: `requestBody.expense_items[${i}].description`,  reason: 'required' });
      if (item.expense_type && !VALID_TYPES.includes(item.expense_type))
        fe.push({ field: `requestBody.expense_items[${i}].expense_type`, reason: `must be one of ${VALID_TYPES.join(', ')}` });
      if (item.amount === undefined || Number(item.amount) <= 0)
        fe.push({ field: `requestBody.expense_items[${i}].amount`, reason: 'must be > 0' });
    });
  }
  if (fe.length) throw new ValidationError('Invalid expense voucher input', fe);
  return model.update(existing.expense_voucher_id, data);
};

exports.remove = async (code) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Expense Voucher ${code} not found`);
  if (existing.status !== 'DRAFT')
    throw new ValidationError(`Expense Voucher ${code} can only be deleted when status is DRAFT`);
  await model.deleteById(existing.expense_voucher_id);
  return { message: `Expense Voucher ${code} deleted successfully` };
};
