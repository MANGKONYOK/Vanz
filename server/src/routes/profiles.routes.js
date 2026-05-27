'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/profiles.controller');

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:profile_id', ctrl.update);
router.delete('/:profile_id', ctrl.remove);

module.exports = router;
