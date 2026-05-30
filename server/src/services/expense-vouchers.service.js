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

function expenseItemsChanged(existingItems, newItems) {
  if (!existingItems || !newItems) return true;
  if (existingItems.length !== newItems.length) return true;
  for (let i = 0; i < newItems.length; i++) {
    const n = newItems[i];
    const ext = existingItems[i];
    if (!ext) return true;
    if (n.expense_type !== ext.expense_type) return true;
    if (n.description !== ext.description) return true;
    if (Math.abs(parseFloat(n.amount) - parseFloat(ext.amount)) > 0.01) return true;
    if ((n.receipt_reference_code || '') !== (ext.receipt_reference_code || '')) return true;
  }
  return false;
}

exports.update = async (code, data) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Expense Voucher ${code} not found`);
  
  const statusUpper = existing.status?.toUpperCase();
  if (statusUpper !== 'DRAFT') {
    const dateChanged = data.voucher_date !== undefined && data.voucher_date !== existing.voucher_date;
    const priceChanged = data.total_amount !== undefined && Math.abs(parseFloat(data.total_amount || 0) - parseFloat(existing.total_amount || 0)) > 0.01;
    const itemsChanged = data.expense_items !== undefined && expenseItemsChanged(existing.expense_items, data.expense_items);
    const deliveryChanged = data.delivery_id !== undefined && parseInt(data.delivery_id, 10) !== parseInt(existing.delivery_id, 10);
    
    if (dateChanged || priceChanged || itemsChanged || deliveryChanged) {
      throw new ValidationError(`Only status can be modified when expense voucher status is ${existing.status}`);
    }
  }

  const result = schemas.expenseVoucherUpdate.safeParse(data);
  if (!result.success) throw new ValidationError('Invalid expense voucher input', toFieldErrors(result.error));
  return model.update(existing.expense_voucher_id, data);
};

exports.remove = async (code) => {
  const existing = await model.findByCode(code);
  if (!existing) throw new NotFoundError(`Expense Voucher ${code} not found`);
  const status = existing.status?.toUpperCase();
  if (status !== 'DRAFT' && status !== 'REJECTED' && status !== 'FAILED') {
    throw new ValidationError(`Expense Voucher ${code} can only be deleted when status is DRAFT, REJECTED, or FAILED`);
  }
  await model.deleteById(existing.expense_voucher_id);
  return { message: `Expense Voucher ${code} deleted successfully` };
};
