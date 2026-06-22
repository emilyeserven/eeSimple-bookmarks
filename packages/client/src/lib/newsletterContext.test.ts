import { describe, expect, it } from "vitest";

import { highlightAnchor } from "./newsletterContext";

describe("highlightAnchor", () => {
  it("bolds an anchor in the middle, splitting into three segments", () => {
    expect(highlightAnchor("read this great article today", "great article")).toEqual([
      {
        text: "read this ",
        bold: false,
      },
      {
        text: "great article",
        bold: true,
      },
      {
        text: " today",
        bold: false,
      },
    ]);
  });

  it("returns a single non-bold segment when the anchor never appears", () => {
    expect(highlightAnchor("nothing to see here", "missing")).toEqual([{
      text: "nothing to see here",
      bold: false,
    }]);
  });

  it("returns a single non-bold segment for null/empty/whitespace anchors", () => {
    const context = "some passage";
    const expected = [{
      text: context,
      bold: false,
    }];
    expect(highlightAnchor(context, null)).toEqual(expected);
    expect(highlightAnchor(context, undefined)).toEqual(expected);
    expect(highlightAnchor(context, "")).toEqual(expected);
    expect(highlightAnchor(context, "   ")).toEqual(expected);
  });

  it("matches case-insensitively but preserves the original casing", () => {
    expect(highlightAnchor("Read The Docs now", "read the docs")).toEqual([
      {
        text: "Read The Docs",
        bold: true,
      },
      {
        text: " now",
        bold: false,
      },
    ]);
  });

  it("bolds every occurrence of the anchor", () => {
    expect(highlightAnchor("go go go", "go")).toEqual([
      {
        text: "go",
        bold: true,
      },
      {
        text: " ",
        bold: false,
      },
      {
        text: "go",
        bold: true,
      },
      {
        text: " ",
        bold: false,
      },
      {
        text: "go",
        bold: true,
      },
    ]);
  });

  it("handles an anchor at the very start", () => {
    expect(highlightAnchor("headline then prose", "headline")).toEqual([
      {
        text: "headline",
        bold: true,
      },
      {
        text: " then prose",
        bold: false,
      },
    ]);
  });

  it("handles an anchor at the very end", () => {
    expect(highlightAnchor("prose then headline", "headline")).toEqual([
      {
        text: "prose then ",
        bold: false,
      },
      {
        text: "headline",
        bold: true,
      },
    ]);
  });

  it("trims the anchor before matching", () => {
    expect(highlightAnchor("click here please", "  here  ")).toEqual([
      {
        text: "click ",
        bold: false,
      },
      {
        text: "here",
        bold: true,
      },
      {
        text: " please",
        bold: false,
      },
    ]);
  });
});
