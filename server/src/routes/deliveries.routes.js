'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/deliveries.controller');

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:delivery_id', ctrl.update);
router.delete('/:delivery_id', ctrl.remove);

module.exports = router;
