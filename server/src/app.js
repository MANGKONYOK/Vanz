'use strict';
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const logger  = require('./utils/logger');
const auth    = require('./utils/auth');

const app = express();
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, _res, next) => { logger.info(`${req.method} ${req.originalUrl}`); next(); });

// ── Apply auth to all /api/v1 routes ─────────────────────────────────────────
app.use('/api/v1', auth);

// ── Route mounts ─────────────────────────────────────────────────────────────
app.use('/api/v1/addresses',             require('./routes/addresses.routes'));
app.use('/api/v1/profiles',              require('./routes/profiles.routes'));
app.use('/api/v1/customers',             require('./routes/customers.routes'));
app.use('/api/v1/deliverers',            require('./routes/deliverers.routes'));
app.use('/api/v1/stores',                require('./routes/stores.routes'));
app.use('/api/v1/store-products',        require('./routes/store-products.routes'));
app.use('/api/v1/favorite-stores',       require('./routes/favorite-stores.routes'));
app.use('/api/v1/reviews',               require('./routes/reviews.routes'));
app.use('/api/v1/deliveries',            require('./routes/deliveries.routes'));
app.use('/api/v1/dispatch-assignments',  require('./routes/dispatch-assignments.routes'));
app.use('/api/v1/delivery-location-logs',require('./routes/delivery-location-logs.routes'));
app.use('/api/v1/orders',                require('./routes/orders.routes'));
app.use('/api/v1/payments',              require('./routes/payments.routes'));
app.use('/api/v1/expense-vouchers',      require('./routes/expense-vouchers.routes'));
app.use('/api/v1/promotions',            require('./routes/promotions.routes'));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error_code: 'NOT_FOUND', message: 'Route not found', field_errors: [] }));

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  logger.error(err.message, err.stack);
  res.status(500).json({ error_code: 'SERVER_ERROR', message: 'An unexpected error occurred', field_errors: [] });
});

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => logger.info(`Vanz API listening on port ${PORT}`));

module.exports = app;
