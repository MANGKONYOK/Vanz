'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/stores.controller');

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:store_code', ctrl.update);
router.delete('/:store_code', ctrl.remove);

module.exports = router;
