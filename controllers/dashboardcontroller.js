const express = require('express');
const path = require('path');

const router = express.Router();

router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/../static/login/login.html'));
});

router.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '/../static/dashboard/dashboard.html'));
});

router.use(express.static('static'));

module.exports = router;
