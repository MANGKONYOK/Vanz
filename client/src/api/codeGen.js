/**
 * codeGen.js — Business Code Generator
 *
 * Finds the lowest positive integer not present in the existing list (gap filling).
 *
 * Supported patterns:
 *   - Fixed prefix with gap filling: "CUST-000001" → nextGapCode(codes, "CUST-", 6)
 *
 * The server respects and stores these codes if provided, and otherwise
 * generates them sequentially.
 */

/**
 * Given an array of existing business codes, return the next code in sequence (filling gaps).
 *
 * @param {string[]} existingCodes - All current codes from GET response (e.g. ["CUST-000001","CUST-000003"])
 * @param {string}   prefix        - Code prefix including dash (e.g. "CUST-")
 * @param {number}   padLen        - Zero-pad length for the numeric suffix (default 6)
 * @returns {string} Next code (e.g. "CUST-000002")
 */
export function nextGapCode(existingCodes, prefix, padLen = 6) {
  const nums = (existingCodes || [])
    .filter(c => typeof c === 'string' && c.startsWith(prefix))
    .map(c => {
      // Find the last sequence of digits in the code
      const match = c.match(/\d+$/);
      return match ? parseInt(match[0], 10) : null;
    })
    .filter(n => n !== null && Number.isFinite(n));

  const numSet = new Set(nums);
  let candidate = 1;
  while (numSet.has(candidate)) {
    candidate++;
  }
  
  // padStart does not truncate if the length of string representation is already greater than padLen
  const suffix = String(candidate).padStart(padLen, '0');
  return `${prefix}${suffix}`;
}

export function nextCode(existingCodes, prefix, padLen = 6) {
  return nextGapCode(existingCodes, prefix, padLen);
}

export function nextYearCode(existingCodes, shortPrefix, year = new Date().getFullYear(), padLen = 6) {
  const prefix = `${shortPrefix}-${year}-`;
  return nextGapCode(existingCodes, prefix, padLen);
}
