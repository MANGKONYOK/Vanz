'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/addresses.controller');

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:address_id', ctrl.update);
router.delete('/:address_id', ctrl.remove);

module.exports = router;
