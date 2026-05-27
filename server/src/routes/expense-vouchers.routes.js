'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/expense-vouchers.controller');

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:voucher_code', ctrl.update);
router.delete('/:voucher_code', ctrl.remove);

module.exports = router;
