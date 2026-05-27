'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/deliverers.controller');

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:deliverer_code', ctrl.update);
router.delete('/:deliverer_code', ctrl.remove);

module.exports = router;
