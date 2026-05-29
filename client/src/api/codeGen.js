/**
 * codeGen.js — Business Code Generator
 *
 * Finds the largest existing code in an array and returns the next sequential one.
 *
 * Supported patterns:
 *   - Fixed prefix:  "CUST-0001"  → nextCode(codes, "CUST-", 4)
 *   - Year-scoped:   "ORD-2026-000001" → nextYearCode(codes, "ORD", 2026, 6)
 *
 * The server always generates the real code on insert (based on row ID).
 * This utility is used by Add forms to display a *predicted* preview code
 * in the read-only Code field before the record is saved.
 */

/**
 * Given an array of existing business codes, return the next code in sequence.
 *
 * @param {string[]} existingCodes - All current codes from GET response (e.g. ["CUST-0001","CUST-0003"])
 * @param {string}   prefix        - Code prefix including dash (e.g. "CUST-")
 * @param {number}   padLen        - Zero-pad length for the numeric suffix (default 4)
 * @returns {string} Next code (e.g. "CUST-0004")
 */
export function nextCode(existingCodes, prefix, padLen = 4) {
  const nums = (existingCodes || [])
    .filter(c => typeof c === 'string' && c.startsWith(prefix))
    .map(c => parseInt(c.slice(prefix.length), 10))
    .filter(n => Number.isFinite(n));

  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `${prefix}${String(max + 1).padStart(padLen, '0')}`;
}

/**
 * Year-scoped variant: "ORD-2026-000001" style codes.
 *
 * @param {string[]} existingCodes - All current codes
 * @param {string}   shortPrefix   - Prefix without year (e.g. "ORD")
 * @param {number}   [year]        - 4-digit year; defaults to current year
 * @param {number}   [padLen]      - Numeric pad length (default 6)
 * @returns {string} e.g. "ORD-2026-000007"
 */
export function nextYearCode(existingCodes, shortPrefix, year = new Date().getFullYear(), padLen = 6) {
  const prefix = `${shortPrefix}-${year}-`;
  return nextCode(existingCodes, prefix, padLen);
}
