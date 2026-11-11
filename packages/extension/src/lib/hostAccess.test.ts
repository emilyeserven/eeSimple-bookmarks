import { describe, expect, it } from "vitest";

import { hostPattern, hostPatterns } from "./hostAccess";

describe("hostPattern", () => {
  it("covers every port and path of the URL's host", () => {
    expect(hostPattern("http://eserve-raspi:3000/bookmarks")).toBe("http://eserve-raspi/*");
    expect(hostPattern("https://cdn.example.com/a/b.jpg?x=1")).toBe("https://cdn.example.com/*");
  });

  it("is null for non-http(s) or unparseable URLs", () => {
    expect(hostPattern("data:image/svg+xml,<svg/>")).toBeNull();
    expect(hostPattern("chrome://extensions")).toBeNull();
    expect(hostPattern("not a url")).toBeNull();
  });
});

describe("hostPatterns", () => {
  it("dedupes hosts and drops URLs that need no host access", () => {
    expect(hostPatterns([
      "https://img.example.com/1.png",
      "https://img.example.com/2.png",
      "data:image/svg+xml;base64,AAAA",
      "http://other.test:8080/x.jpg",
    ])).toEqual(["https://img.example.com/*", "http://other.test/*"]);
  });
});
