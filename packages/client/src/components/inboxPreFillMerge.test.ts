// @vitest-environment node
import type { InboxPreFillDefaults } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { mergeInboxPreFill } from "./inboxPreFillMerge";

describe("mergeInboxPreFill", () => {
  it("prefers the per-item scalar values over the batch prefill", () => {
    const item: InboxPreFillDefaults = {
      categoryId: "item-cat",
      mediaTypeId: "item-mt",
      publisherId: "item-pub",
    };
    const batch: InboxPreFillDefaults = {
      categoryId: "batch-cat",
      mediaTypeId: "batch-mt",
      publisherId: "batch-pub",
    };
    const merged = mergeInboxPreFill(item, batch);
    expect(merged.categoryId).toBe("item-cat");
    expect(merged.mediaTypeId).toBe("item-mt");
    expect(merged.publisherId).toBe("item-pub");
  });

  it("falls back to the batch scalar values when the item leaves them unset", () => {
    const merged = mergeInboxPreFill({}, {
      categoryId: "batch-cat",
      mediaTypeId: "batch-mt",
      publisherId: "batch-pub",
    });
    expect(merged.categoryId).toBe("batch-cat");
    expect(merged.mediaTypeId).toBe("batch-mt");
    expect(merged.publisherId).toBe("batch-pub");
  });

  it("unions tag ids, item first", () => {
    const merged = mergeInboxPreFill({
      tagIds: ["a", "b"],
    }, {
      tagIds: ["c"],
    });
    expect(merged.tagIds).toEqual(["a", "b", "c"]);
  });

  it("uses the item's authors when non-empty, else the batch's", () => {
    expect(mergeInboxPreFill({
      authorIds: ["x"],
    }, {
      authorIds: ["y"],
    }).authorIds).toEqual(["x"]);
    expect(mergeInboxPreFill({
      authorIds: [],
    }, {
      authorIds: ["y"],
    }).authorIds).toEqual(["y"]);
    expect(mergeInboxPreFill({}, {
      authorIds: ["y"],
    }).authorIds).toEqual(["y"]);
  });

  it("sources the custom-property value arrays only from the batch prefill", () => {
    const batch: InboxPreFillDefaults = {
      numberValues: [{
        propertyId: "p",
        value: 1,
      }],
      booleanValues: [{
        propertyId: "b",
        value: true,
      }],
    };
    const merged = mergeInboxPreFill({}, batch);
    expect(merged.numberValues).toEqual(batch.numberValues);
    expect(merged.booleanValues).toEqual(batch.booleanValues);
  });

  it("handles a missing batch prefill", () => {
    const merged = mergeInboxPreFill({
      categoryId: "item-cat",
      tagIds: ["a"],
    }, undefined);
    expect(merged.categoryId).toBe("item-cat");
    expect(merged.tagIds).toEqual(["a"]);
    expect(merged.mediaTypeId).toBeUndefined();
    expect(merged.numberValues).toBeUndefined();
  });
});
