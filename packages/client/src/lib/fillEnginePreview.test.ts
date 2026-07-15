import type { WebsiteExtensionFillRule } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { previewMatchesExpected, runFillPreview } from "./fillEnginePreview";

/** A minimal complete rule capturing a title into a `field` target. */
function titleRule(overrides: Partial<WebsiteExtensionFillRule> = {}): WebsiteExtensionFillRule {
  return {
    id: "r1",
    label: "Title",
    target: {
      kind: "field",
      field: "title",
    },
    extract: {
      selector: "h1",
    },
    ...overrides,
  };
}

describe("runFillPreview", () => {
  it("runs a rule against pasted HTML and returns the captured values", () => {
    const results = runFillPreview([titleRule()], "<h1>Hello World</h1>");
    expect(results).toHaveLength(1);
    expect(results[0].values).toEqual(["Hello World"]);
  });

  it("normalizes away an incomplete rule (blank selector) before running", () => {
    const results = runFillPreview([titleRule({
      extract: {
        selector: "   ",
      },
    })], "<h1>Hello</h1>");
    expect(results).toEqual([]);
  });

  it("returns structured entries for a sections rule", () => {
    const rule: WebsiteExtensionFillRule = {
      id: "sec",
      label: "Chapters",
      target: {
        kind: "sections",
        propertyId: "22222222-2222-2222-2222-222222222222",
        entryType: "name",
      },
      extract: {
        selector: ".lec",
      },
    };
    const html = "<ul><li class=\"lec\">Intro</li><li class=\"lec\">Setup</li></ul>";
    const [result] = runFillPreview([rule], html);
    expect(result.entries).toEqual([
      {
        name: "Intro",
        type: "name",
        startValue: "",
      },
      {
        name: "Setup",
        type: "name",
        startValue: "",
      },
    ]);
  });
});

describe("previewMatchesExpected", () => {
  const result = {
    ruleId: "r1",
    values: ["Hello World"],
  };

  it("returns null when no expectation is given", () => {
    expect(previewMatchesExpected(result, "   ")).toBeNull();
  });

  it("returns 'invalid' for non-JSON expected text", () => {
    expect(previewMatchesExpected(result, "not json")).toBe("invalid");
  });

  it("matches the flat values (key-order independent)", () => {
    expect(previewMatchesExpected(result, "[\"Hello World\"]")).toBe("match");
    expect(previewMatchesExpected(result, "[\"Other\"]")).toBe("mismatch");
  });

  it("compares against entries when present", () => {
    const sections = {
      ruleId: "s",
      values: [""],
      entries: [{
        name: "Intro",
        type: "name",
        startValue: "",
      }],
    };
    expect(previewMatchesExpected(sections, "[{\"type\":\"name\",\"name\":\"Intro\",\"startValue\":\"\"}]")).toBe("match");
  });
});
