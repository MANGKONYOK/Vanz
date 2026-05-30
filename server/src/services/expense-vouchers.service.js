'use strict';
const model = require('../models/expense-vouchers.model');
const { ValidationError, NotFoundError } = require('../utils/errors');
const { schemas } = require('../schemas');

function toFieldErrors(zodError) {
  return zodError.issues.map(issue => ({
    field: `requestBody.${issue.path.join('.')}`,
    reason: issue.message,
  }));
}
const VALID_TYPES = ['FUEL', 'MAINTENANCE', 'TOLL', 'OTHER'];

exports.list = (q) => model.findAll(q);

exports.create = async (data) => {
  const result = schemas.expenseVoucherCreate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid expense voucher input', toFieldErrors(result.error));
  return model.create(data);
};

exports.update = async (code, data) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Expense Voucher ${code} not found`);
  if (existing.status?.toUpperCase() !== 'DRAFT')
    throw new ValidationError(`Expense Voucher ${code} can only be updated when status is DRAFT`);
  const result = schemas.expenseVoucherUpdate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid expense voucher input', toFieldErrors(result.error));
  return model.update(existing.expense_voucher_id, data);
};

exports.remove = async (code) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Expense Voucher ${code} not found`);
  if (existing.status?.toUpperCase() !== 'DRAFT')
    throw new ValidationError(`Expense Voucher ${code} can only be deleted when status is DRAFT`);
  await model.deleteById(existing.expense_voucher_id);
  return { message: `Expense Voucher ${code} deleted successfully` };
};
