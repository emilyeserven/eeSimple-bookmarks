import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildGitHubIssueUrl } from "./bugReport";

/** Decode the `body` query param back into the rendered issue markdown for assertions. */
function bodyOf(url: string): string {
  return new URL(url).searchParams.get("body") ?? "";
}

describe("buildGitHubIssueUrl", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-28T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("points at the repo's new-issue endpoint with a bug label and operation title", () => {
    const url = new URL(buildGitHubIssueUrl({
      operation: "website favicon",
      errorMessage: "boom",
    }));
    expect(url.origin + url.pathname).toBe("https://github.com/emilyeserven/eesimple-bookmarks/issues/new");
    expect(url.searchParams.get("title")).toBe("Image fetch failed: website favicon");
    expect(url.searchParams.get("labels")).toBe("bug");
  });

  it("always includes operation, error message, page, user agent, and a pinned timestamp", () => {
    const body = bodyOf(buildGitHubIssueUrl({
      operation: "channel avatar",
      errorMessage: "503",
    }));
    expect(body).toContain("**Operation:** channel avatar");
    expect(body).toContain("**Error message:** 503");
    expect(body).toContain("**Page:**");
    expect(body).toContain("**User agent:**");
    expect(body).toContain("**Timestamp:** 2026-06-28T12:00:00.000Z");
  });

  it("omits the optional URL and error-code lines when not provided", () => {
    const body = bodyOf(buildGitHubIssueUrl({
      operation: "x",
      errorMessage: "y",
    }));
    expect(body).not.toContain("**URL:**");
    expect(body).not.toContain("**Error code:**");
  });

  it("includes the source URL and error code lines when provided", () => {
    const body = bodyOf(
      buildGitHubIssueUrl({
        operation: "x",
        errorMessage: "y",
        errorCode: "IMAGE_TOO_LARGE",
        sourceUrl: "https://src.test/page",
      }),
    );
    expect(body).toContain("**URL:** https://src.test/page");
    expect(body).toContain("**Error code:** `IMAGE_TOO_LARGE`");
  });
});
