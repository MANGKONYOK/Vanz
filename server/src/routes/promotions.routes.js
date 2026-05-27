'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/promotions.controller');

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:promotion_code', ctrl.update);
router.delete('/:promotion_code', ctrl.remove);

module.exports = router;
