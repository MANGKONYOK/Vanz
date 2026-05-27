'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/dispatch-assignments.controller');

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:assignment_id', ctrl.update);
router.delete('/:assignment_id', ctrl.remove);

module.exports = router;
