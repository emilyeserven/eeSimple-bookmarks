// @vitest-environment node
import type { FillTransform } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { applyFillTransform, applyFillTransforms, parseDurationSeconds } from "./fillTransformPreview";

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

  it("duration — parity with the worked example and units", () => {
    expect(applyFillTransform("77h 32m", {
      kind: "duration",
    })).toBe("279120");
    expect(applyFillTransform("1y 2mo 6d 23h 34m 34s", {
      kind: "duration",
    })).toBe("37323274");
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
