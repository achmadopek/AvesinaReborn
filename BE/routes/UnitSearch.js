// routes/UnitSearch.js
const express = require('express');
const router = express.Router();
const unitSearchController = require('../controllers/unitSearchController');

router.get('/', unitSearchController.getUnitSearch);

module.exports = router;
