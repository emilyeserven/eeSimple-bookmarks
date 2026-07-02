// @vitest-environment node
import type { ShortenedLink, Website } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { canonicalize, cleanUrl } from "./urlCleanup";
import { makeWebsite } from "../test-utils/factories";

function youtube(shortened?: Partial<ShortenedLink>): Website {
  return makeWebsite({
    id: "yt",
    domain: "youtube.com",
    siteName: "YouTube",
    slug: "youtube",
    builtIn: true,
    shortenedLinks: [
      {
        domain: "youtu.be",
        expandTo: "https://www.youtube.com/watch?v={id}",
        keepShortened: false,
        ...shortened,
      },
    ],
    paramRules: [
      {
        pathSuffix: "/watch",
        params: ["v"],
      },
      {
        pathSuffix: "/playlist",
        params: ["list"],
      },
    ],
  });
}

const ignoreList = ["bit.ly", "t.co"];

describe("canonicalize — param rules", () => {
  it("keeps only the whitelisted param for the matching path", () => {
    const watch = canonicalize("https://www.youtube.com/watch?v=FqWBQv7h_3I&list=RD&index=8", {
      mode: "none",
      websites: [youtube()],
      ignoreList,
    });
    expect(watch.url).toBe("https://www.youtube.com/watch?v=FqWBQv7h_3I");
    expect(watch.matchedWebsite?.domain).toBe("youtube.com");

    const playlist = canonicalize("https://www.youtube.com/playlist?list=PL123", {
      mode: "none",
      websites: [youtube()],
      ignoreList,
    });
    expect(playlist.url).toBe("https://www.youtube.com/playlist?list=PL123");
  });

  it("applies param rules regardless of cleanup mode (protects v under 'all')", () => {
    const result = canonicalize("https://www.youtube.com/watch?v=X&list=Y", {
      mode: "all",
      websites: [youtube()],
      ignoreList,
    });
    expect(result.url).toBe("https://www.youtube.com/watch?v=X");
  });

  it("strips all params when the site has rules but none match the path", () => {
    const result = canonicalize("https://www.youtube.com/feed/subscriptions?ab=1", {
      mode: "none",
      websites: [youtube()],
      ignoreList,
    });
    expect(result.url).toBe("https://www.youtube.com/feed/subscriptions");
  });
});

describe("canonicalize — shortened links", () => {
  it("expands a verified short link to its long form (no nudge)", () => {
    const result = canonicalize("https://youtu.be/FqWBQv7h_3I?si=abc", {
      mode: "none",
      websites: [youtube()],
      ignoreList,
    });
    expect(result.url).toBe("https://www.youtube.com/watch?v=FqWBQv7h_3I");
    expect(result.expanded).toBe(true);
    expect(result.shortener).toBe("verified");
    expect(result.nudge).toBe(false);
    expect(result.matchedWebsite?.domain).toBe("youtube.com");
  });

  it("keeps a 'keep-shortened' link and nudges instead of expanding", () => {
    const result = canonicalize("https://youtu.be/FqWBQv7h_3I", {
      mode: "none",
      websites: [youtube({
        keepShortened: true,
      })],
      ignoreList,
    });
    expect(result.url).toBe("https://youtu.be/FqWBQv7h_3I");
    expect(result.expanded).toBe(false);
    expect(result.shortener).toBe("verified");
    expect(result.nudge).toBe(true);
  });

  it("nudges for a generic ignore-list shortener with no expansion", () => {
    const result = canonicalize("https://bit.ly/abc123", {
      mode: "none",
      websites: [youtube()],
      ignoreList,
    });
    expect(result.url).toBe("https://bit.ly/abc123");
    expect(result.shortener).toBe("generic");
    expect(result.nudge).toBe(true);
    expect(result.matchedWebsite).toBeNull();
  });
});

describe("canonicalize — non-rule sites honor mode", () => {
  const data = (mode: "none" | "trackers" | "all") => ({
    mode,
    websites: [youtube()],
    ignoreList,
  });

  it("leaves URLs untouched in 'none' mode", () => {
    expect(canonicalize("https://example.com/a?b=1", data("none")).url).toBe("https://example.com/a?b=1");
  });
  it("strips known trackers in 'trackers' mode", () => {
    expect(canonicalize("https://example.com/a?b=1&utm_source=x", data("trackers")).url).toBe(
      "https://example.com/a?b=1",
    );
  });
  it("strips all params in 'all' mode", () => {
    expect(canonicalize("https://example.com/a?b=1", data("all")).url).toBe("https://example.com/a");
  });
});

describe("cleanUrl wrapper", () => {
  it("returns just the cleaned URL string", () => {
    expect(cleanUrl("https://youtu.be/FqWBQv7h_3I", {
      mode: "none",
      websites: [youtube()],
      ignoreList,
    })).toBe("https://www.youtube.com/watch?v=FqWBQv7h_3I");
  });
  it("returns unparseable input unchanged", () => {
    expect(cleanUrl("not a url", {
      mode: "all",
      websites: [],
      ignoreList,
    })).toBe("not a url");
  });
});
