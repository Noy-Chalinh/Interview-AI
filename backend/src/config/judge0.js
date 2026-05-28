const axios = require('axios');

const judge0 = axios.create({
  baseURL: process.env.JUDGE0_URL || 'http://localhost:2358',
  headers: { 'Content-Type': 'application/json' }
});

module.exports = judge0;