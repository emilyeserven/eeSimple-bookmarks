const GITHUB_ISSUES_URL = "https://github.com/emilyeserven/eesimple-bookmarks/issues/new";

export interface BugReportContext {
  /** Short label for what operation failed, e.g. "website favicon", "YouTube channel avatar". */
  operation: string;
  errorMessage: string;
  errorCode?: string;
}

export function buildGitHubIssueUrl({ operation, errorMessage, errorCode }: BugReportContext): string {
  const lines = [
    `**Operation:** ${operation}`,
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
