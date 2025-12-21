const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controllors');
router.get("/login", authController.login);
router.get("/callback", authController.callback);
router.post("/refresh", authController.refreshToken);
router.get("/logout", authController.logout);
module.exports = router;
