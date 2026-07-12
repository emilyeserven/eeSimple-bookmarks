// @vitest-environment node
import { describe, expect, it } from "vitest";

import { sectionEntryTypeHint } from "./sectionEntryTypeHint";

const mediaTypes = [
  {
    id: "mt-video",
    slug: "video",
    parentId: null,
  },
  {
    id: "mt-movie",
    slug: "movie",
    parentId: "mt-video",
  },
  {
    id: "mt-book",
    slug: "book",
    parentId: null,
  },
  {
    id: "mt-website",
    slug: "website-app",
    parentId: null,
  },
  {
    id: "mt-course",
    slug: "course",
    parentId: null,
  },
];

describe("sectionEntryTypeHint", () => {
  it("maps the known slugs to their natural entry type", () => {
    expect(sectionEntryTypeHint("mt-video", mediaTypes)).toBe("timestamp");
    expect(sectionEntryTypeHint("mt-book", mediaTypes)).toBe("page");
    expect(sectionEntryTypeHint("mt-website", mediaTypes)).toBe("url");
  });

  it("walks ancestors — a Movie under Video hints timestamp", () => {
    expect(sectionEntryTypeHint("mt-movie", mediaTypes)).toBe("timestamp");
  });

  it("returns undefined for an unknown slug chain, a missing id, or no media type", () => {
    expect(sectionEntryTypeHint("mt-course", mediaTypes)).toBeUndefined();
    expect(sectionEntryTypeHint("mt-nope", mediaTypes)).toBeUndefined();
    expect(sectionEntryTypeHint(null, mediaTypes)).toBeUndefined();
  });

  it("survives a parentId cycle without looping forever", () => {
    const cyclic = [
      {
        id: "a",
        slug: "x",
        parentId: "b",
      },
      {
        id: "b",
        slug: "y",
        parentId: "a",
      },
    ];
    expect(sectionEntryTypeHint("a", cyclic)).toBeUndefined();
  });
});
