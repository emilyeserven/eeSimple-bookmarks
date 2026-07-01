import { ApiError, describeError } from "./apiError";
import { notifyError } from "./notifications";

const GITHUB_ISSUES_URL = "https://github.com/emilyeserven/eesimple-bookmarks/issues/new";

export interface BugReportContext {
  /** Short label for what operation failed, e.g. "website favicon", "YouTube channel avatar". */
  operation: string;
  errorMessage: string;
  errorCode?: string;
  /** Raw underlying error captured by the server (e.g. a sharp decode failure), if any. */
  errorDetail?: string;
  /** The source URL the image was being grabbed from (website homepage, channel page, bookmark URL). */
  sourceUrl?: string;
}

/**
 * Show an error toast for a failed image auto-fetch, with a pre-filled "File issue" GitHub
 * action button. Shared by the three image auto-fetch mutation hooks. `sourceUrl` is the URL the
 * image was being grabbed from, so the filed issue is reproducible.
 */
export function notifyImageFetchError(
  err: Error,
  operation: string,
  fallback: string,
  sourceUrl?: string,
): void {
  const code = err instanceof ApiError ? err.code : undefined;
  // The server may capture a raw underlying error (e.g. a sharp decode failure) that it doesn't
  // fold into the user-facing message — surface it to devtools so it's not lost.
  if (err instanceof ApiError && err.detail) {
    console.error(`${operation} failed:`, err.detail);
  }
  // Pass a serializable `link` (not a raw Sonner action) so the "File issue" URL is preserved in the
  // Notifications log, not lost when the transient toast dismisses.
  notifyError(describeError(err, fallback), {
    link: {
      label: "File issue",
      href: buildGitHubIssueUrl({
        operation,
        errorMessage: err.message,
        errorCode: code,
        errorDetail: err instanceof ApiError ? err.detail : undefined,
        sourceUrl,
      }),
    },
  });
}

export function buildGitHubIssueUrl({
  operation,
  errorMessage,
  errorCode,
  errorDetail,
  sourceUrl,
}: BugReportContext): string {
  const lines = [
    `**Operation:** ${operation}`,
    ...(sourceUrl ? [`**URL:** ${sourceUrl}`] : []),
    `**Error message:** ${errorMessage}`,
    ...(errorCode ? [`**Error code:** \`${errorCode}\``] : []),
    ...(errorDetail ? [`**Error detail:** ${errorDetail}`] : []),
    `**Page:** ${window.location.href}`,
    `**User agent:** ${navigator.userAgent}`,
    `**Timestamp:** ${new Date().toISOString()}`,
  ];
  const url = new URL(GITHUB_ISSUES_URL);
  url.searchParams.set("title", `Image fetch failed: ${operation}`);
  url.searchParams.set("body", lines.join("\n\n"));
  url.searchParams.set("labels", "bug");
  return url.toString();
}
