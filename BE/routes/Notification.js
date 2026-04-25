// Import Express dan inisialisasi Router
const express = require('express');
const router = express.Router();

// Import controller untuk Master Pegawai
const notificationController = require('../controllers/notificationController');

// -- Notification --
router.get('/', notificationController.getData);

module.exports = router;
