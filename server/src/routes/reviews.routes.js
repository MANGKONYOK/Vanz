'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/reviews.controller');

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:review_id', ctrl.update);
router.delete('/:review_id', ctrl.remove);

module.exports = router;
