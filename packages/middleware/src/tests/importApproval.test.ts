import assert from "node:assert/strict";
import { test } from "node:test";

import type { InboxPreFillDefaults } from "@eesimple/types";

import { approvalTitle, buildApprovalBookmarkInput, mergeApprovalPropertyValues, mergeApprovalTagIds, pickApprovalCategoryId } from "@/services/importApproval";

const emptyAutofill = {
  numberValues: [],
  booleanValues: [],
  dateTimeValues: [],
};

test("mergeApprovalPropertyValues: pre-fill values are used when autofill sets nothing", () => {
  const preFill: InboxPreFillDefaults = {
    numberValues: [{
      propertyId: "n1",
      value: 5,
    }],
    booleanValues: [{
      propertyId: "b1",
      value: true,
    }],
    dateTimeValues: [{
      propertyId: "d1",
      value: "2026-01-01",
    }],
  };
  const merged = mergeApprovalPropertyValues(emptyAutofill, preFill);
  assert.deepEqual(merged.numberValues, [{
    propertyId: "n1",
    value: 5,
  }]);
  assert.deepEqual(merged.booleanValues, [{
    propertyId: "b1",
    value: true,
  }]);
  assert.deepEqual(merged.dateTimeValues, [{
    propertyId: "d1",
    value: "2026-01-01",
  }]);
});

test("mergeApprovalPropertyValues: autofill wins for a property it sets; pre-fill fills the rest", () => {
  const autofill = {
    numberValues: [{
      propertyId: "shared",
      value: 1,
    }],
    booleanValues: [],
    dateTimeValues: [],
  };
  const preFill: InboxPreFillDefaults = {
    numberValues: [
      {
        propertyId: "shared",
        value: 99,
      },
      {
        propertyId: "other",
        value: 7,
      },
    ],
  };
  const merged = mergeApprovalPropertyValues(autofill, preFill);
  assert.deepEqual(merged.numberValues, [
    {
      propertyId: "shared",
      value: 1,
    },
    {
      propertyId: "other",
      value: 7,
    },
  ]);
});

test("mergeApprovalPropertyValues: autofill ownership of a property id spans value kinds", () => {
  // Autofill sets `p` as a number, so a pre-fill boolean for the same id is dropped.
  const autofill = {
    numberValues: [{
      propertyId: "p",
      value: 1,
    }],
    booleanValues: [],
    dateTimeValues: [],
  };
  const preFill: InboxPreFillDefaults = {
    booleanValues: [{
      propertyId: "p",
      value: true,
    }],
  };
  const merged = mergeApprovalPropertyValues(autofill, preFill);
  assert.deepEqual(merged.booleanValues, []);
});

test("mergeApprovalPropertyValues: undefined pre-fill yields just the autofill values", () => {
  const autofill = {
    numberValues: [{
      propertyId: "n",
      value: 2,
    }],
    booleanValues: [],
    dateTimeValues: [],
  };
  const merged = mergeApprovalPropertyValues(autofill, undefined);
  assert.deepEqual(merged.numberValues, [{
    propertyId: "n",
    value: 2,
  }]);
});

test("approvalTitle: prefers title, then anchor text, then the URL", () => {
  assert.equal(approvalTitle({
    title: " Real Title ",
    anchorText: "anchor",
    url: "https://x.com",
  }), "Real Title");
  assert.equal(approvalTitle({
    title: "  ",
    anchorText: " Anchor ",
    url: "https://x.com",
  }), "Anchor");
  assert.equal(approvalTitle({
    title: null,
    anchorText: null,
    url: "https://x.com",
  }), "https://x.com");
});

test("mergeApprovalTagIds: dedup-unions defaults, pre-fill, and autofill ids", () => {
  assert.deepEqual(
    mergeApprovalTagIds(["a", "b"], ["b", "c"], ["c", "d"]),
    ["a", "b", "c", "d"],
  );
  assert.deepEqual(mergeApprovalTagIds(undefined, undefined, ["x"]), ["x"]);
});

test("pickApprovalCategoryId: per-item override wins over everything else", () => {
  assert.equal(
    pickApprovalCategoryId({
      itemCategoryId: "item",
      preFillCategoryId: "pre",
      importDefaultCategoryId: "imp",
      newsletterDefaultCategoryId: "news",
      autofillCategoryId: "auto",
    }),
    "item",
  );
});

test("pickApprovalCategoryId: falls through pre-fill > import > newsletter > autofill", () => {
  const base = {
    itemCategoryId: null,
    preFillCategoryId: undefined,
    importDefaultCategoryId: undefined,
    newsletterDefaultCategoryId: undefined,
    autofillCategoryId: undefined,
  };
  assert.equal(pickApprovalCategoryId({
    ...base,
    preFillCategoryId: "pre",
    importDefaultCategoryId: "imp",
  }), "pre");
  assert.equal(pickApprovalCategoryId({
    ...base,
    importDefaultCategoryId: "imp",
    newsletterDefaultCategoryId: "news",
  }), "imp");
  assert.equal(pickApprovalCategoryId({
    ...base,
    newsletterDefaultCategoryId: "news",
    autofillCategoryId: "auto",
  }), "news");
  assert.equal(pickApprovalCategoryId({
    ...base,
    autofillCategoryId: "auto",
  }), "auto");
});

test("pickApprovalCategoryId: returns undefined when nothing is set", () => {
  assert.equal(
    pickApprovalCategoryId({
      itemCategoryId: null,
      importDefaultCategoryId: null,
    }),
    undefined,
  );
});

test("buildApprovalBookmarkInput: applies per-field precedence and drops empty value arrays", () => {
  const input = buildApprovalBookmarkInput({
    url: "https://x.com/a",
    title: "Title",
    item: {
      newsletterContext: "context passage",
      description: "item desc",
    },
    defaults: {
      importId: "imp1",
      newsletterId: "news1",
      mediaTypeId: "mt-default",
      tagIds: ["t1"],
    },
    preFill: {
      tagIds: ["t2"],
      mediaTypeId: "mt-pre",
      groupIds: ["grp-pre"],
    },
    autofillTagIds: ["t3"],
    autofillLocationIds: [],
    autofillMediaTypeId: "mt-auto",
    mergedNumberValues: [{
      propertyId: "n",
      value: 1,
    }],
    mergedBooleanValues: [],
    mergedDateTimeValues: [],
    categoryId: "cat1",
  });
  // newsletter context wins for description; pre-fill media type wins; tags are dedup-unioned.
  assert.equal(input.description, "context passage");
  assert.equal(input.mediaTypeId, "mt-pre");
  assert.deepEqual(input.groupIds, ["grp-pre"]);
  assert.deepEqual(input.tagIds, ["t1", "t2", "t3"]);
  assert.equal(input.importId, "imp1");
  assert.equal(input.categoryId, "cat1");
  // non-empty number values survive; empty boolean/date arrays become undefined.
  assert.deepEqual(input.numberValues, [{
    propertyId: "n",
    value: 1,
  }]);
  assert.equal(input.booleanValues, undefined);
  assert.equal(input.dateTimeValues, undefined);
});

test("buildApprovalBookmarkInput: falls back to item description, then default media type", () => {
  const input = buildApprovalBookmarkInput({
    url: "https://x.com/b",
    title: "T",
    item: {
      newsletterContext: null,
      description: "fallback desc",
    },
    defaults: {
      importId: "imp",
      newsletterId: null,
      mediaTypeId: "mt-default",
    },
    preFill: undefined,
    autofillTagIds: [],
    autofillLocationIds: [],
    autofillMediaTypeId: "mt-auto",
    mergedNumberValues: [],
    mergedBooleanValues: [],
    mergedDateTimeValues: [],
    categoryId: undefined,
  });
  assert.equal(input.description, "fallback desc");
  assert.equal(input.mediaTypeId, "mt-default");
  assert.equal(input.categoryId, undefined);
  assert.deepEqual(input.tagIds, []);
});
