/**
 * Pure ISBN checksum/conversion math shared by the API (`@eesimple/middleware`) and the React
 * client. No network access — just string/digit arithmetic — so both packages can validate and
 * canonicalize ISBNs from the same logic.
 */

/** Strip dashes/spaces, leaving only digits and a possible trailing `X`/`x`. */
function cleanIsbn(value: string): string {
  return value.replace(/[\s-]/g, "");
}

/** Checksum-valid ISBN-10: 9 digits + a trailing check digit (0-9 or `X` for 10), mod-11. */
export function isValidIsbn10(value: string): boolean {
  const v = cleanIsbn(value);
  if (!/^\d{9}[\dXx]$/.test(v)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += (i + 1) * Number(v[i]);
  const last = v[9].toUpperCase() === "X" ? 10 : Number(v[9]);
  sum += 10 * last;
  return sum % 11 === 0;
}

/** Checksum-valid ISBN-13: 13 digits, mod-10 with alternating 1/3 (EAN) weights. */
export function isValidIsbn13(value: string): boolean {
  const v = cleanIsbn(value);
  if (!/^\d{13}$/.test(v)) return false;
  let sum = 0;
  for (let i = 0; i < 13; i++) sum += Number(v[i]) * (i % 2 === 0 ? 1 : 3);
  return sum % 10 === 0;
}

/**
 * Convert an ISBN-10-shaped value (9 digits + a trailing digit/`X`, dashes/spaces allowed) to
 * ISBN-13 by swapping in the `978` prefix and recomputing the check digit. Checksum-blind by
 * design — it recomputes rather than trusting the input's own check digit, so it also normalizes a
 * mistyped manual entry. Returns `null` when `value` isn't ISBN-10-shaped.
 */
export function isbn10ToIsbn13(value: string): string | null {
  const v = cleanIsbn(value);
  if (!/^\d{9}[\dXx]$/.test(v)) return null;
  const digits = `978${v.slice(0, 9)}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(digits[i]) * (i % 2 === 0 ? 1 : 3);
  const check = (10 - (sum % 10)) % 10;
  return `${digits}${check}`;
}

/**
 * Recover the ISBN-10 form of a `978`-prefixed ISBN-13 (lossless standard conversion), recomputing
 * the ISBN-10 check digit. Returns `null` for `979`-prefixed ISBN-13s (no ISBN-10 equivalent
 * exists) or input that isn't 13 digits.
 */
export function isbn13ToIsbn10(value: string): string | null {
  const v = cleanIsbn(value);
  if (!/^\d{13}$/.test(v) || !v.startsWith("978")) return null;
  const core = v.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += (i + 1) * Number(core[i]);
  const check = sum % 11;
  return `${core}${check === 10 ? "X" : check}`;
}

/**
 * Canonicalize a raw ISBN-like string (dashes/spaces allowed) to compact ISBN-13: strips
 * separators, accepts a 13-digit or ISBN-10-shaped (9 digits + digit/`X`) value, and converts
 * ISBN-10 to ISBN-13. Returns `null` when the cleaned value is neither shape. Checksum-blind (pair
 * with {@link isValidIsbn10}/{@link isValidIsbn13} where strict validity matters, e.g. an ASIN that
 * may not be an ISBN at all).
 */
export function normalizeIsbnTo13(value: string): string | null {
  const v = cleanIsbn(value);
  if (/^\d{13}$/.test(v)) return v;
  if (/^\d{9}[\dXx]$/.test(v)) return isbn10ToIsbn13(v);
  return null;
}
