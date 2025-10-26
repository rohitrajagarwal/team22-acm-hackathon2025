const express = require('express');
const router = express.Router();


router.get('/health', (req, res) => {
    res.json({ message: "Server running successfully." });
});

module.exports = router;
