/** True when `value` parses as an http(s) URL — mirrors the middleware's guard. */
export function isFetchableUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  }
  catch {
    return false;
  }
}
