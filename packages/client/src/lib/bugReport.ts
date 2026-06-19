import { ApiError } from "./apiError";
import { notifyError } from "./notifications";

const GITHUB_ISSUES_URL = "https://github.com/emilyeserven/eesimple-bookmarks/issues/new";

export interface BugReportContext {
  /** Short label for what operation failed, e.g. "website favicon", "YouTube channel avatar". */
  operation: string;
  errorMessage: string;
  errorCode?: string;
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
  notifyError(err.message || fallback, {
    action: {
      label: "File issue",
      onClick: () =>
        window.open(
          buildGitHubIssueUrl({
            operation,
            errorMessage: err.message,
            errorCode: code,
            sourceUrl,
          }),
          "_blank",
          "noopener,noreferrer",
        ),
    },
  });
}

export function buildGitHubIssueUrl({
  operation,
  errorMessage,
  errorCode,
  sourceUrl,
}: BugReportContext): string {
  const lines = [
    `**Operation:** ${operation}`,
    ...(sourceUrl ? [`**URL:** ${sourceUrl}`] : []),
    `**Error message:** ${errorMessage}`,
    ...(errorCode ? [`**Error code:** \`${errorCode}\``] : []),
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
