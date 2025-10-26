const express = require('express');
const router = express.Router();
const { health } = require('../controllers/healthController');

router.get('/health', health);
// simple health endpoint
router.get('/health', (req, res) => {
	res.json({ message: 'Server running successfully.' });
});

module.exports = router;
