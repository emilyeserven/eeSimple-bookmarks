import { describe, expect, it } from "vitest";

import { canonicalizeYouTubeUrl, cleanUrl } from "./urlCleanup";

describe("canonicalizeYouTubeUrl", () => {
  it("keeps only the v param on a watch URL", () => {
    expect(
      canonicalizeYouTubeUrl("https://www.youtube.com/watch?v=FqWBQv7h_3I&list=RDYjPMupS1Lg4&index=8"),
    ).toBe("https://www.youtube.com/watch?v=FqWBQv7h_3I");
  });

  it("keeps the list param on a playlist URL", () => {
    expect(
      canonicalizeYouTubeUrl("https://www.youtube.com/playlist?list=PLI6O8zuzXWiTxBwGQ9N4t0RAKw9jYc7IP"),
    ).toBe("https://www.youtube.com/playlist?list=PLI6O8zuzXWiTxBwGQ9N4t0RAKw9jYc7IP");
  });

  it("strips all query params from short links and other YouTube paths", () => {
    expect(canonicalizeYouTubeUrl("https://youtu.be/FqWBQv7h_3I?si=abc&t=42")).toBe(
      "https://youtu.be/FqWBQv7h_3I",
    );
    expect(canonicalizeYouTubeUrl("https://www.youtube.com/shorts/abc123?feature=share")).toBe(
      "https://www.youtube.com/shorts/abc123",
    );
  });

  it("leaves non-YouTube and unparseable URLs unchanged", () => {
    expect(canonicalizeYouTubeUrl("https://example.com/watch?v=abc&utm_source=x")).toBe(
      "https://example.com/watch?v=abc&utm_source=x",
    );
    expect(canonicalizeYouTubeUrl("not a url")).toBe("not a url");
  });
});

describe("cleanUrl", () => {
  it("canonicalizes YouTube URLs even when the mode is 'none'", () => {
    expect(
      cleanUrl("https://www.youtube.com/watch?v=FqWBQv7h_3I&list=RDYjPMupS1Lg4&index=8", "none"),
    ).toBe("https://www.youtube.com/watch?v=FqWBQv7h_3I");
  });

  it("never strips the v param from a YouTube watch URL under 'all'", () => {
    expect(
      cleanUrl("https://www.youtube.com/watch?v=FqWBQv7h_3I&list=RDYjPMupS1Lg4", "all"),
    ).toBe("https://www.youtube.com/watch?v=FqWBQv7h_3I");
  });

  it("still applies the normal modes to non-YouTube URLs", () => {
    expect(cleanUrl("https://example.com/a?b=1", "none")).toBe("https://example.com/a?b=1");
    expect(cleanUrl("https://example.com/a?b=1&utm_source=x", "trackers")).toBe(
      "https://example.com/a?b=1",
    );
    expect(cleanUrl("https://example.com/a?b=1", "all")).toBe("https://example.com/a");
  });
});
