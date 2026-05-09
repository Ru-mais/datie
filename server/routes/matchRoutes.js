const express = require('express');
const matchController = require('../controllers/matchController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

router.get('/discovery', matchController.getDiscoveryProfiles);
router.post('/swipe', matchController.handleSwipe);
router.get('/matches', matchController.getMatches);

module.exports = router;
