'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/store-products.controller');

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:product_id', ctrl.update);
router.delete('/:product_id', ctrl.remove);

module.exports = router;
