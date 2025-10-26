const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// This is the single endpoint the frontend will call
// Full path: POST /api/auth/google/callback
router.post('/google/callback', authController.handleGoogleCallback);

module.exports = router;
