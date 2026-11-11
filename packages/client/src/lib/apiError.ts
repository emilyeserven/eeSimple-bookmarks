/** Interpolation values the server echoes back alongside an error code. */
export type ErrorParams = Record<string, string | number>;

/**
 * An Error subclass that carries the API error envelope's `code` (and `params`) from a 4xx/5xx
 * response body, plus an optional `detail` — a raw underlying error message the server captured
 * but didn't fold into the user-facing `message`, so callers can console-log it. Branch on `code`
 * when a caller needs to react to a specific failure (e.g. `duplicateName`).
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly detail?: string,
    public readonly params?: ErrorParams,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Turn a caught error into specific toast/notification text. The single place that decides what an
 * error "says": the server's `message` for an {@link ApiError} (the middleware writes it for humans),
 * a plain Error's message, or `fallback`. Use this everywhere an error toast is fired so the
 * Notifications log records the real reason, not a generic string.
 */
export function describeError(err: unknown, fallback = "Something went wrong"): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
