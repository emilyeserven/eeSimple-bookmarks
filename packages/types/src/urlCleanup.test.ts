import assert from "node:assert/strict";
import { test } from "node:test";

import type { Website } from "./index.js";
import type { CanonicalizeData } from "./urlCleanup.js";

import { canonicalize, cleanUrl } from "./urlCleanup.js";

function website(overrides: Partial<Website> = {}): Website {
  return {
    id: overrides.domain ?? "w",
    domain: "example.com",
    siteName: "Example",
    slug: "example",
    description: null,
    builtIn: false,
    shortenedLinks: [],
    paramRules: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    socialLinks: [],
    labeledWebsites: [],
    alternateNames: [],
    ...overrides,
  };
}

function data(overrides: Partial<CanonicalizeData> = {}): CanonicalizeData {
  return {
    mode: "none",
    websites: [],
    ignoreList: [],
    ...overrides,
  };
}

test("mode 'none' returns the raw URL unchanged (no normalization diff)", () => {
  const url = "https://example.com/a?b=1";
  assert.equal(cleanUrl(url, data({
    mode: "none",
  })), url);
});

test("mode 'trackers' strips known tracking params but keeps the rest", () => {
  const result = canonicalize(
    "https://example.com/p?utm_source=news&id=42&fbclid=xyz",
    data({
      mode: "trackers",
    }),
  );
  assert.equal(result.url, "https://example.com/p?id=42");
});

test("mode 'all' strips every query param", () => {
  assert.equal(
    cleanUrl("https://example.com/p?a=1&b=2", data({
      mode: "all",
    })),
    "https://example.com/p",
  );
});

test("returns the input unchanged for an unparseable URL", () => {
  const result = canonicalize("not a url", data({
    mode: "all",
  }));
  assert.equal(result.url, "not a url");
  assert.equal(result.matchedWebsite, null);
});

test("matches a website by host and applies its param rules over the mode", () => {
  const site = website({
    domain: "shop.com",
    paramRules: [{
      pathSuffix: "",
      params: ["ref"],
    }],
  });
  const result = canonicalize(
    "https://shop.com/item?ref=keep&utm_source=drop",
    data({
      mode: "trackers",
      websites: [site],
    }),
  );
  assert.equal(result.url, "https://shop.com/item?ref=keep");
  assert.equal(result.matchedWebsite, site);
});

test("expands a verified shortened link to its long form", () => {
  const site = website({
    domain: "youtube.com",
    shortenedLinks: [{
      domain: "youtu.be",
      expandTo: "https://youtube.com/watch?v={id}",
      keepShortened: false,
    }],
  });
  const result = canonicalize("https://youtu.be/abc123", data({
    websites: [site],
  }));
  assert.equal(result.expanded, true);
  assert.equal(result.shortener, "verified");
  assert.equal(result.url, "https://youtube.com/watch?v=abc123");
});

test("keepShortened link is not expanded and nudges instead", () => {
  const site = website({
    domain: "youtube.com",
    shortenedLinks: [{
      domain: "youtu.be",
      expandTo: "https://youtube.com/watch?v={id}",
      keepShortened: true,
    }],
  });
  const result = canonicalize("https://youtu.be/abc123", data({
    websites: [site],
  }));
  assert.equal(result.expanded, false);
  assert.equal(result.nudge, true);
  assert.equal(result.shortener, "verified");
});

test("a generic shortener in the ignore list nudges without expanding", () => {
  const result = canonicalize("https://bit.ly/xyz", data({
    ignoreList: ["bit.ly"],
  }));
  assert.equal(result.shortener, "generic");
  assert.equal(result.nudge, true);
  assert.equal(result.matchedWebsite, null);
});

test("selects the matching paramRule by path suffix among several rules", () => {
  const site = website({
    domain: "youtube.com",
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
  const watch = canonicalize(
    "https://youtube.com/watch?v=abc&list=RD",
    data({
      websites: [site],
    }),
  );
  assert.equal(watch.url, "https://youtube.com/watch?v=abc");

  const playlist = canonicalize(
    "https://youtube.com/playlist?list=PL123&v=xyz",
    data({
      websites: [site],
    }),
  );
  assert.equal(playlist.url, "https://youtube.com/playlist?list=PL123");
});

test("strips all params when the site has paramRules but none match the path", () => {
  const site = website({
    domain: "youtube.com",
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
  const result = canonicalize(
    "https://youtube.com/feed/subscriptions?ab=1",
    data({
      websites: [site],
    }),
  );
  assert.equal(result.url, "https://youtube.com/feed/subscriptions");
});

test("a 'contains' rule matches a suffix that appears mid-path, unlike the default 'suffix' mode", () => {
  const site = website({
    domain: "example.com",
    paramRules: [{
      pathSuffix: "/watch",
      matchMode: "contains",
      params: ["v"],
    }],
  });
  const result = canonicalize(
    "https://example.com/some/watch/extra?v=abc&drop=1",
    data({
      websites: [site],
    }),
  );
  assert.equal(result.url, "https://example.com/some/watch/extra?v=abc");
});

test("an absent matchMode behaves identically to explicit 'suffix' mode", () => {
  const site = website({
    domain: "example.com",
    paramRules: [{
      pathSuffix: "/watch",
      params: ["v"],
    }],
  });
  const result = canonicalize(
    "https://example.com/some/watch/extra?v=abc",
    data({
      websites: [site],
    }),
  );
  assert.equal(result.url, "https://example.com/some/watch/extra");
});

test("a matched website's stripParams blacklist drops those params while keeping the rest", () => {
  const site = website({
    domain: "youtube.com",
    stripParams: ["t", "si"],
  });
  const result = canonicalize(
    "https://youtube.com/watch?v=abc&t=90&si=xyz",
    data({
      mode: "none",
      websites: [site],
    }),
  );
  assert.equal(result.url, "https://youtube.com/watch?v=abc");
  assert.equal(result.matchedWebsite, site);
});

test("stripParams applies even in mode 'none' (a pure blacklist hit re-serializes)", () => {
  const site = website({
    domain: "youtube.com",
    stripParams: ["t"],
  });
  const result = canonicalize(
    "https://youtube.com/watch?v=abc&t=90",
    data({
      mode: "none",
      websites: [site],
    }),
  );
  assert.equal(result.url, "https://youtube.com/watch?v=abc");
});

test("stripParams is a no-op when the site has no matching params", () => {
  const site = website({
    domain: "youtube.com",
    stripParams: ["t"],
  });
  const url = "https://youtube.com/watch?v=abc";
  assert.equal(cleanUrl(url, data({
    mode: "none",
    websites: [site],
  })), url);
});

test("stripParams has no effect when the URL host matches no website", () => {
  const site = website({
    domain: "youtube.com",
    stripParams: ["t"],
  });
  const url = "https://other.com/watch?v=abc&t=90";
  assert.equal(cleanUrl(url, data({
    mode: "none",
    websites: [site],
  })), url);
});

test("stripParams applies after a verified shortened link expands to the parent site", () => {
  const site = website({
    domain: "youtube.com",
    stripParams: ["t"],
    shortenedLinks: [{
      domain: "youtu.be",
      expandTo: "https://youtube.com/watch?v={id}&t=90",
      keepShortened: false,
    }],
  });
  const result = canonicalize("https://youtu.be/abc123", data({
    mode: "none",
    websites: [site],
  }));
  assert.equal(result.url, "https://youtube.com/watch?v=abc123");
});

test("longest-match tie-break still applies across mixed match modes", () => {
  const site = website({
    domain: "example.com",
    paramRules: [
      {
        pathSuffix: "/watch",
        matchMode: "contains",
        params: ["v"],
      },
      {
        pathSuffix: "/watch/extra",
        params: ["v", "t"],
      },
    ],
  });
  const result = canonicalize(
    "https://example.com/some/watch/extra?v=abc&t=5&drop=1",
    data({
      websites: [site],
    }),
  );
  assert.equal(result.url, "https://example.com/some/watch/extra?v=abc&t=5");
});
