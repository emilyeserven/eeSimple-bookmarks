// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  eligibleCustomCardFields,
  HEADER_CARD_FIELD_KEYS,
  STANDARD_CARD_FIELDS,
} from "./bookmarkCardFieldDefs";
import { makeCustomProperty as property } from "../test-utils/factories";

describe("STANDARD_CARD_FIELDS / HEADER_CARD_FIELD_KEYS", () => {
  it("lists the title and action header fields among the standard fields", () => {
    const keys = STANDARD_CARD_FIELDS.map(f => f.key);
    expect(keys).toContain("title");
    expect(keys).toContain("secondaryName");
    expect(keys).toContain("externalLink");
    expect(keys).toContain("more");
    expect(HEADER_CARD_FIELD_KEYS).toEqual(["title", "externalLink", "more"]);
  });
});

describe("eligibleCustomCardFields", () => {
  it("includes a listed, category-scoped, non-calculate property as { key: id, label: name }", () => {
    const prop = property({
      id: "p1",
      name: "Rating",
      type: "number",
      showInListings: true,
      categoryIds: ["cat-1"],
    });
    expect(eligibleCustomCardFields([prop])).toEqual([{
      key: "p1",
      label: "Rating",
    }]);
  });

  it("includes a property scoped to all categories even with no explicit ids", () => {
    const prop = property({
      id: "p2",
      name: "Watched",
      type: "boolean",
      showInListings: true,
      allCategories: true,
      categoryIds: [],
    });
    expect(eligibleCustomCardFields([prop])).toEqual([{
      key: "p2",
      label: "Watched",
    }]);
  });

  it("includes an unscoped property (no explicit ids) since empty categoryIds means all categories", () => {
    const prop = property({
      id: "u",
      name: "Complexity",
      type: "ratingScale",
      showInListings: true,
      allCategories: false,
      categoryIds: [],
    });
    expect(eligibleCustomCardFields([prop])).toEqual([{
      key: "u",
      label: "Complexity",
    }]);
  });

  it("excludes properties hidden from listings or calculate types", () => {
    const hidden = property({
      id: "h",
      showInListings: false,
      categoryIds: ["c"],
    });
    const calc = property({
      id: "c",
      type: "calculate",
      showInListings: true,
      categoryIds: ["c"],
    });
    expect(eligibleCustomCardFields([hidden, calc])).toEqual([]);
  });
});
