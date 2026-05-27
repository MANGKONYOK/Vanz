'use strict';
const LEVEL_MAP = { error: 0, warn: 1, info: 2, debug: 3 };
const current = LEVEL_MAP[process.env.LOG_LEVEL] ?? 2;

function log(level, ...args) {
  if (LEVEL_MAP[level] <= current) {
    const ts = new Date().toISOString();
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(`[${ts}] [${level.toUpperCase()}]`, ...args);
  }
}

module.exports = {
  error: (...a) => log('error', ...a),
  warn:  (...a) => log('warn',  ...a),
  info:  (...a) => log('info',  ...a),
  debug: (...a) => log('debug', ...a),
};
