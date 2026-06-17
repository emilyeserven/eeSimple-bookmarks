/**
 * Returns true when `value` parses as an absolute URL using the http or https protocol.
 * Used to validate bookmark URLs beyond what JSON-schema can express.
 */
export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  }
  catch {
    return false;
  }
}
