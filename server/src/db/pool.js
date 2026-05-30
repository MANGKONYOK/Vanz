'use strict';
const { Pool } = require('pg');
require('dotenv').config();

// Parse unified DATABASE_URL if present
if (process.env.DATABASE_URL) {
  try {
    const parsed = new URL(process.env.DATABASE_URL);
    process.env.DB_PROTOCOL = parsed.protocol.replace(':', '');
    process.env.DB_USERNAME = decodeURIComponent(parsed.username || '');
    process.env.DB_PASSWORD = decodeURIComponent(parsed.password || '');
    process.env.DB_HOST = parsed.hostname || '';
    process.env.DB_PORT = parsed.port || '5432';
    process.env.DB_NAME = parsed.pathname.replace(/^\//, '') || '';
  } catch (e) {
    console.error('[pool] Failed to parse DATABASE_URL:', e.message);
  }
}

const sslEnabled = String(process.env.DB_SSL || '').toLowerCase() === 'true';

const dbProtocol = process.env.DB_PROTOCAL || process.env.DB_PROTOCOL;
const dbHost = process.env.DB_HOST;
const dbPortRaw = process.env.DB_PORT;
const dbName = process.env.DB_NAME;
const dbUsername = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;

const missing = [];
if (!dbProtocol) missing.push('DB_PROTOCOL');
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

const protocolLower = String(dbProtocol).toLowerCase();
if (protocolLower !== 'postgresql' && protocolLower !== 'postgres') {
  throw new Error(
    `Unsupported DB_PROTOCOL value "${dbProtocol}". Expected "postgresql" or "postgres".`,
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
    console.log('[pool] Successfully connected to PostgreSQL.');
  })
  .catch((err) => {
    console.error('[pool] Failed to connect to PostgreSQL:', err.message);
  });

pool.on('error', (err) => {
  console.error('[pool] Unexpected error on idle client', err);
  process.exit(1);
});

module.exports = pool;
