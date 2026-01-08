const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const tokenManager = require('../utils/tokenManager');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.post('/logout', tokenManager.authenticateToken, authController.logout);
router.get('/profile', tokenManager.authenticateToken, authController.getCurrentProfile);
router.put('/profile', tokenManager.authenticateToken, authController.updateProfile);
router.post('/become-seller', tokenManager.authenticateToken, authController.becomeSeller);

module.exports = router;
