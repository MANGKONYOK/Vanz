'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/customers.controller');

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:customer_code', ctrl.update);
router.delete('/:customer_code', ctrl.remove);

module.exports = router;
