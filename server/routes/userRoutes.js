const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes after this middleware
router.use(authMiddleware.protect);

router.get('/me', userController.getMe);
router.patch('/updateMe', userController.updateMe);

module.exports = router;
