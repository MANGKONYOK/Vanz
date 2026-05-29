'use strict';
const winston = require('winston');

const { combine, timestamp, printf, colorize } = winston.format;

const myFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    myFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        myFormat
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ],
});

module.exports = {
  error: (...args) => logger.error(args.join(' ')),
  warn: (...args) => logger.warn(args.join(' ')),
  info: (...args) => logger.info(args.join(' ')),
  debug: (...args) => logger.debug(args.join(' ')),
};
