const express = require('express');
const router = express.Router();

// ✅ Correct way to import default-exported function
const proxyHandler = require('../controller/proxyHandler');

// ✅ Must pass a real function here
router.get('/', proxyHandler);

module.exports = router;
