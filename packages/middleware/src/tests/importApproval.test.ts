import assert from "node:assert/strict";
import { test } from "node:test";

import type { InboxPreFillDefaults } from "@eesimple/types";

import { approvalTitle, mergeApprovalPropertyValues, mergeApprovalTagIds } from "@/services/importApproval";

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
