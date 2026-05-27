'use strict';
const { Pool } = require('pg');
require('dotenv').config();

const sslEnabled = String(process.env.DB_SSL || '').toLowerCase() === 'true';

const dbProtocol = process.env.DB_PROTOCAL || process.env.DB_PROTOCOL;
const dbHost = process.env.DB_HOST;
const dbPortRaw = process.env.DB_PORT;
const dbName = process.env.DB_NAME;
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;

const missing = [];
if (!dbProtocol) missing.push('DB_PROTOCAL');
if (!dbHost) missing.push('DB_HOST');
if (!dbPortRaw) missing.push('DB_PORT');
if (!dbName) missing.push('DB_NAME');
if (!dbUsername) missing.push('DB_USERNAME');
if (!dbPassword) missing.push('DB_PASSWORD');

if (missing.length > 0) {
  throw new Error(
    `Missing required database environment variables: ${missing.join(', ')}. ` +
      'Please configure your .env file before starting the server.',
  );
}

if (String(dbProtocol).toLowerCase() !== 'postgresql') {
  throw new Error(
    `Unsupported DB_PROTOCAL value "${dbProtocol}". Expected "postgresql".`,
  );
}

const dbPort = parseInt(dbPortRaw, 10);
if (!Number.isInteger(dbPort) || dbPort <= 0) {
  throw new Error(`Invalid DB_PORT value "${dbPortRaw}". It must be a positive integer.`);
}

const poolConfig = {
  host: dbHost,
  port: dbPort,
  database: dbName,
  user: dbUsername,
  password: dbPassword,
  ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
  // Supabase Session Pooler allows max 15 connections per client.
  // Keep well below that limit to leave headroom for migrations / admin tools.
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

const pool = new Pool(poolConfig);

pool
  .connect()
  .then((client) => {
    client.release();
  })
  .catch((err) => {
    console.error('[pool] Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  });

pool.on('error', (err) => {
  console.error('[pool] Unexpected error on idle client', err);
  process.exit(1);
});

module.exports = pool;
