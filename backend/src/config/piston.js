const axios = require('axios');

const piston = axios.create({
  baseURL: process.env.PISTON_URL || 'http://localhost:2358',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

module.exports = piston;
