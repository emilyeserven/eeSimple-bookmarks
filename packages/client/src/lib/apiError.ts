import type { ErrorParams } from "@/lib/errorMessages";

import i18n from "@/i18n";
import { translateErrorCode } from "@/lib/errorMessages";

/**
 * An Error subclass that carries a typed error `code` from the API's 4xx/5xx response body, plus an
 * optional `detail` — the raw underlying error message (e.g. a sharp decode error) the server
 * captured but didn't fold into the user-facing `message`, so callers can console-log it — and the
 * optional `params` the server echoed for interpolating the localized message.
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
 * error "says": for an {@link ApiError} carrying a known `code`, the localized phrase from the
 * error-code map (interpolated with the server's `params`); otherwise the server's raw English
 * `message` (unknown/uncoded errors stay English, by design), a plain Error's message, or the
 * translated `fallback`. Use this everywhere an error toast is fired so the Notifications log records
 * the real reason, not a generic string.
 */
export function describeError(err: unknown, fallback = "Something went wrong"): string {
  if (err instanceof ApiError) {
    if (err.code) {
      const translated = translateErrorCode(err.code, err.params);
      if (translated) return translated;
    }
    return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return i18n.t(fallback);
}
