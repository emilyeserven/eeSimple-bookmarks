/** An Error subclass that carries a typed error code from the API's 4xx/5xx response body. */
export class ApiError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Turn a caught error into specific toast/notification text. The single place that decides what an
 * error "says": the server's `message` plus its diagnostic `code` (when an {@link ApiError}), a plain
 * Error's message, or the `fallback` when nothing useful is available. Use this everywhere an error
 * toast is fired so the Notifications log records the real reason, not a generic string.
 */
export function describeError(err: unknown, fallback = "Something went wrong"): string {
  if (err instanceof ApiError) return err.code ? `${err.message} (${err.code})` : err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
