const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middleware/verifyToken');

router.post('/login', authController.login);
router.post('/select-role', authController.selectRole);
router.post('/refresh', authController.refreshToken);

module.exports = router;
