const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controllors');

// Redirect user to Keycloak login
router.get('/login', authController.login);

// Callback for Authorization Code Flow
router.get('/callback', authController.callback);

// Refresh token
router.post('/refresh', authController.refreshToken);

// Logout
router.get('/logout', authController.logout);

module.exports = router;
