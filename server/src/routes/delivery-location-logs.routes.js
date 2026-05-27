'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/delivery-location-logs.controller');

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:location_log_id', ctrl.update);
router.delete('/:location_log_id', ctrl.remove);

module.exports = router;
