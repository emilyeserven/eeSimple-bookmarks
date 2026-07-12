// @vitest-environment node
import type { FillTransform } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { applyFillTransform, applyFillTransforms, normalizeDateValue, parseDurationSeconds } from "./fillTransformPreview";

describe("applyFillTransform", () => {
  it("regex — extracts the capture group; invalid pattern yields empty (never throws)", () => {
    expect(applyFillTransform("ISBN: 978-1-234", {
      kind: "regex",
      pattern: "ISBN:\\s*([\\d-]+)",
      group: 1,
    })).toBe("978-1-234");
    expect(applyFillTransform("hi", {
      kind: "regex",
      pattern: "(",
    })).toBe("");
  });

  it("number — first numeric run with commas stripped", () => {
    expect(applyFillTransform("1,234 reviews", {
      kind: "number",
    })).toBe("1234");
    expect(applyFillTransform("no digits", {
      kind: "number",
    })).toBe("");
  });

  it("replace — rewrites the match; invalid pattern yields empty", () => {
    expect(applyFillTransform("Hello World", {
      kind: "replace",
      pattern: "World",
      replacement: "There",
    })).toBe("Hello There");
    expect(applyFillTransform("hi", {
      kind: "replace",
      pattern: "(",
      replacement: "x",
    })).toBe("");
  });

  it("trim — strips surrounding whitespace", () => {
    expect(applyFillTransform("  padded  ", {
      kind: "trim",
    })).toBe("padded");
  });

  it("affix — prepends prefix and appends suffix (each optional)", () => {
    expect(applyFillTransform("/books/1", {
      kind: "affix",
      prefix: "https://x.com",
    })).toBe("https://x.com/books/1");
    expect(applyFillTransform("abc", {
      kind: "affix",
      suffix: "!",
    })).toBe("abc!");
    expect(applyFillTransform("mid", {
      kind: "affix",
      prefix: "[",
      suffix: "]",
    })).toBe("[mid]");
    expect(applyFillTransform("unchanged", {
      kind: "affix",
    })).toBe("unchanged");
  });

  it("absoluteUrl — resolves against the base URL; passes through without one", () => {
    const base = "https://x.com/list/page";
    expect(applyFillTransform("/books/1", {
      kind: "absoluteUrl",
    }, base)).toBe("https://x.com/books/1");
    expect(applyFillTransform("//cdn.x.com/a.jpg", {
      kind: "absoluteUrl",
    }, base)).toBe("https://cdn.x.com/a.jpg");
    expect(applyFillTransform("https://y.com/z", {
      kind: "absoluteUrl",
    }, base)).toBe("https://y.com/z");
    // No base URL supplied → passthrough (the preview's mid-typing default).
    expect(applyFillTransform("/books/1", {
      kind: "absoluteUrl",
    })).toBe("/books/1");
  });

  it("youtubeThumbnail — derives the thumbnail URL from any YouTube URL; passes through others", () => {
    const thumb = "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg";
    expect(applyFillTransform("https://www.youtube.com/watch?v=dQw4w9WgXcQ", {
      kind: "youtubeThumbnail",
    })).toBe(thumb);
    expect(applyFillTransform("https://youtu.be/dQw4w9WgXcQ", {
      kind: "youtubeThumbnail",
    })).toBe(thumb);
    expect(applyFillTransform("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0", {
      kind: "youtubeThumbnail",
    })).toBe(thumb);
    // A URL / videoId buried in a lazy embed's attribute (Substack-style data-attrs) still resolves.
    expect(applyFillTransform("{\"videoId\":\"dQw4w9WgXcQ\",\"startTime\":null}", {
      kind: "youtubeThumbnail",
    })).toBe(thumb);
    expect(applyFillTransform("<iframe src=\"https://youtu.be/dQw4w9WgXcQ\"></iframe>", {
      kind: "youtubeThumbnail",
    })).toBe(thumb);
    // A bare 11-char id resolves too.
    expect(applyFillTransform("dQw4w9WgXcQ", {
      kind: "youtubeThumbnail",
    })).toBe(thumb);
    // Not a YouTube URL → passthrough.
    expect(applyFillTransform("https://example.com/video", {
      kind: "youtubeThumbnail",
    })).toBe("https://example.com/video");
  });

  it("duration — parity with the worked example and units", () => {
    expect(applyFillTransform("77h 32m", {
      kind: "duration",
    })).toBe("279120");
    expect(applyFillTransform("1y 2mo 6d 23h 34m 34s", {
      kind: "duration",
    })).toBe("37323274");
  });

  it("date — normalizes to YYYY-MM / YYYY-MM-DD; unrecognized yields empty", () => {
    expect(applyFillTransform("June 2026", {
      kind: "date",
    })).toBe("2026-06");
    expect(applyFillTransform("June 21, 2026", {
      kind: "date",
    })).toBe("2026-06-21");
    expect(applyFillTransform("not a date", {
      kind: "date",
    })).toBe("");
  });
});

describe("normalizeDateValue", () => {
  it("month names in any order, with abbreviations, suffixes, and commas", () => {
    expect(normalizeDateValue("June 2026")).toBe("2026-06");
    expect(normalizeDateValue("Jun 2026")).toBe("2026-06");
    expect(normalizeDateValue("June 21, 2026")).toBe("2026-06-21");
    expect(normalizeDateValue("June 21 2026")).toBe("2026-06-21");
    expect(normalizeDateValue("21 June 2026")).toBe("2026-06-21");
    expect(normalizeDateValue("21st Jun 2026")).toBe("2026-06-21");
    expect(normalizeDateValue("Sept 3, 2026")).toBe("2026-09-03");
  });

  it("ISO passthrough and numeric slash forms", () => {
    expect(normalizeDateValue("2026-06-21")).toBe("2026-06-21");
    expect(normalizeDateValue("2026-06")).toBe("2026-06");
    expect(normalizeDateValue("2026/6/21")).toBe("2026-06-21");
    expect(normalizeDateValue("06/21/2026")).toBe("2026-06-21");
    expect(normalizeDateValue("06/2026")).toBe("2026-06");
  });

  it("returns empty for unrecognized input or out-of-range month/day", () => {
    expect(normalizeDateValue("Junuary 2026")).toBe("");
    expect(normalizeDateValue("2026-13")).toBe("");
    expect(normalizeDateValue("June 32, 2026")).toBe("");
    expect(normalizeDateValue("")).toBe("");
  });
});

describe("parseDurationSeconds", () => {
  it("sums each unit into total seconds", () => {
    expect(parseDurationSeconds("77h 32m")).toBe("279120");
    expect(parseDurationSeconds("77 hours and 32 minutes")).toBe("279120");
    expect(parseDurationSeconds("1h30m")).toBe("5400");
    expect(parseDurationSeconds("90m")).toBe("5400");
    expect(parseDurationSeconds("1.5h")).toBe("5400");
  });

  it("disambiguates months (mo) from minutes (m) and allows over-range components", () => {
    expect(parseDurationSeconds("1y 2mo 6d 23h 34m 34s")).toBe("37323274");
    expect(parseDurationSeconds("1y 23mo 343d 90h 93m 93s")).toBe("121116873");
  });

  it("returns empty when no unit token is present", () => {
    expect(parseDurationSeconds("no duration here")).toBe("");
    expect(parseDurationSeconds("")).toBe("");
  });
});

describe("applyFillTransforms", () => {
  it("runs the list in order (the extension's per-value pipeline)", () => {
    // replace pads the value, trim strips it, an anchored regex then matches — same chain the engine test uses.
    const chain: FillTransform[] = [
      {
        kind: "replace",
        pattern: "^(.*)$",
        replacement: "  $1  ",
      },
      {
        kind: "trim",
      },
      {
        kind: "regex",
        pattern: "^(\\d+)$",
        group: 1,
      },
    ];
    expect(applyFillTransforms("336", chain)).toBe("336");
  });

  it("an empty transform list returns the value unchanged", () => {
    expect(applyFillTransforms("unchanged", [])).toBe("unchanged");
  });

  it("duration feeds a downstream transform", () => {
    expect(applyFillTransforms("77h 32m", [{
      kind: "duration",
    }])).toBe("279120");
  });
});
