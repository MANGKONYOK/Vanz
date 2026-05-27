'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/orders.controller');

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:order_code', ctrl.update);
router.delete('/:order_code', ctrl.remove);

module.exports = router;
