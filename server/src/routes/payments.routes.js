'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/payments.controller');

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:payment_code', ctrl.update);
router.delete('/:payment_code', ctrl.remove);

module.exports = router;
