// @vitest-environment node
import { describe, expect, it } from "vitest";

import { isFetchableUrl } from "./url";

describe("isFetchableUrl", () => {
  it("accepts http and https URLs", () => {
    expect(isFetchableUrl("http://example.com")).toBe(true);
    expect(isFetchableUrl("https://example.com/path?q=1")).toBe(true);
  });

  it("rejects non-http(s) protocols", () => {
    expect(isFetchableUrl("ftp://example.com")).toBe(false);
    expect(isFetchableUrl("mailto:a@b.com")).toBe(false);
    expect(isFetchableUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects strings that do not parse as a URL", () => {
    expect(isFetchableUrl("not a url")).toBe(false);
    expect(isFetchableUrl("")).toBe(false);
    expect(isFetchableUrl("example.com")).toBe(false);
  });
});
