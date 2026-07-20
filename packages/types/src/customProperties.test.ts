import assert from "node:assert/strict";
import { test } from "node:test";

import type { ItemInItemsTextSource, RatingLabelSource, SectionEntry } from "./customProperties.js";

import { clampRatingMax, countSectionLeaves, resolveItemInItemsTexts, resolveRatingLevelLabel, setSectionCompleted, setSectionFavorite } from "./customProperties.js";

function entry(overrides: Partial<SectionEntry> & { id: string }): SectionEntry {
  return {
    name: overrides.id,
    type: "page",
    startValue: "1",
    ...overrides,
  };
}

test("countSectionLeaves counts a childless tier-1 entry as one leaf", () => {
  const result = countSectionLeaves([
    entry({
      id: "a",
      completed: true,
    }),
    entry({
      id: "b",
    }),
  ]);
  assert.deepEqual(result, {
    total: 2,
    completed: 1,
  });
});

test("countSectionLeaves measures a tiered entry by its children, ignoring the parent's own flag", () => {
  const result = countSectionLeaves([
    entry({
      id: "parent",
      completed: true,
      children: [
        entry({
          id: "c1",
          completed: true,
        }),
        entry({
          id: "c2",
        }),
        entry({
          id: "c3",
        }),
      ],
    }),
    entry({
      id: "solo",
    }),
  ]);
  assert.deepEqual(result, {
    total: 4,
    completed: 1,
  });
});

test("countSectionLeaves of an empty list is 0/0", () => {
  assert.deepEqual(countSectionLeaves([]), {
    total: 0,
    completed: 0,
  });
});

test("countSectionLeaves skips a childless entry excluded from progress", () => {
  const result = countSectionLeaves([
    entry({
      id: "a",
      completed: true,
      excludeFromProgress: true,
    }),
    entry({
      id: "b",
      completed: true,
    }),
  ]);
  assert.deepEqual(result, {
    total: 1,
    completed: 1,
  });
});

test("countSectionLeaves skips excluded children of a tiered entry, counting only non-excluded ones", () => {
  const result = countSectionLeaves([
    entry({
      id: "parent",
      children: [
        entry({
          id: "c1",
          completed: true,
          excludeFromProgress: true,
        }),
        entry({
          id: "c2",
          completed: true,
        }),
        entry({
          id: "c3",
          excludeFromProgress: true,
        }),
      ],
    }),
  ]);
  assert.deepEqual(result, {
    total: 1,
    completed: 1,
  });
});

test("setSectionCompleted on a parent cascades to all children", () => {
  const sections = [
    entry({
      id: "parent",
      children: [entry({
        id: "c1",
      }), entry({
        id: "c2",
        completed: false,
      })],
    }),
  ];
  const result = setSectionCompleted(sections, "parent", true);
  assert.equal(result[0].completed, true);
  assert.deepEqual(result[0].children?.map(c => c.completed), [true, true]);
  // Input is untouched (immutable update).
  assert.equal(sections[0].completed, undefined);
});

test("setSectionCompleted on a child touches only that child", () => {
  const sections = [
    entry({
      id: "parent",
      completed: true,
      children: [entry({
        id: "c1",
      }), entry({
        id: "c2",
      })],
    }),
  ];
  const result = setSectionCompleted(sections, "c2", true);
  assert.equal(result[0].completed, true);
  assert.equal(result[0].children?.[0].completed, undefined);
  assert.equal(result[0].children?.[1].completed, true);
});

test("setSectionCompleted can uncheck a parent, cascading false to children", () => {
  const sections = [
    entry({
      id: "parent",
      completed: true,
      children: [entry({
        id: "c1",
        completed: true,
      })],
    }),
  ];
  const result = setSectionCompleted(sections, "parent", false);
  assert.equal(result[0].completed, false);
  assert.equal(result[0].children?.[0].completed, false);
});

test("setSectionFavorite on a parent does NOT cascade to children", () => {
  const sections = [
    entry({
      id: "parent",
      children: [entry({
        id: "c1",
      }), entry({
        id: "c2",
      })],
    }),
  ];
  const result = setSectionFavorite(sections, "parent", true);
  assert.equal(result[0].isFavorite, true);
  assert.deepEqual(result[0].children?.map(c => c.isFavorite), [undefined, undefined]);
  // Input is untouched (immutable update).
  assert.equal(sections[0].isFavorite, undefined);
});

test("setSectionFavorite on a child touches only that child", () => {
  const sections = [
    entry({
      id: "parent",
      children: [entry({
        id: "c1",
      }), entry({
        id: "c2",
      })],
    }),
  ];
  const result = setSectionFavorite(sections, "c2", true);
  assert.equal(result[0].isFavorite, undefined);
  assert.equal(result[0].children?.[0].isFavorite, undefined);
  assert.equal(result[0].children?.[1].isFavorite, true);
});

function textSource(overrides: Partial<ItemInItemsTextSource>): ItemInItemsTextSource {
  return {
    itemInItemsBeforeText: null,
    itemInItemsBetweenText: " of ",
    itemInItemsAfterText: " pages",
    itemInItemsMediaTypeTexts: null,
    ...overrides,
  };
}

test("resolveItemInItemsTexts returns the base texts when there is no override", () => {
  assert.deepEqual(resolveItemInItemsTexts(textSource({}), "mt-course"), {
    before: null,
    between: " of ",
    after: " pages",
  });
});

test("resolveItemInItemsTexts applies a media-type override per field, inheriting the rest", () => {
  const source = textSource({
    itemInItemsMediaTypeTexts: {
      "mt-course": {
        afterText: " modules",
      },
    },
  });
  assert.deepEqual(resolveItemInItemsTexts(source, "mt-course"), {
    before: null,
    between: " of ",
    after: " modules",
  });
  // A different media type falls back to the base texts.
  assert.deepEqual(resolveItemInItemsTexts(source, "mt-book"), {
    before: null,
    between: " of ",
    after: " pages",
  });
});

test("resolveItemInItemsTexts with a null media type uses the base texts", () => {
  const source = textSource({
    itemInItemsMediaTypeTexts: {
      "mt-course": {
        afterText: " modules",
      },
    },
  });
  assert.deepEqual(resolveItemInItemsTexts(source, null), {
    before: null,
    between: " of ",
    after: " pages",
  });
});

test("resolveItemInItemsTexts: a per-bookmark override wins over the media-type override and base", () => {
  const source = textSource({
    itemInItemsMediaTypeTexts: {
      "mt-course": {
        afterText: " modules",
      },
    },
  });
  assert.deepEqual(
    resolveItemInItemsTexts(source, "mt-course", {
      beforeText: "chapter ",
      afterText: " sections",
    }),
    {
      before: "chapter ",
      between: " of ",
      after: " sections",
    },
  );
});

test("resolveItemInItemsTexts: per-bookmark override falls through per field to media-type then base", () => {
  const source = textSource({
    itemInItemsMediaTypeTexts: {
      "mt-course": {
        afterText: " modules",
      },
    },
  });
  // Only `before` is overridden per bookmark; `after` inherits the media-type override, `between` the base.
  assert.deepEqual(
    resolveItemInItemsTexts(source, "mt-course", {
      beforeText: "on page ",
      afterText: null,
    }),
    {
      before: "on page ",
      between: " of ",
      after: " modules",
    },
  );
});

test("resolveItemInItemsTexts: an absent/null per-bookmark override is byte-identical to the two-arg call", () => {
  const source = textSource({
    itemInItemsMediaTypeTexts: {
      "mt-course": {
        afterText: " modules",
      },
    },
  });
  assert.deepEqual(
    resolveItemInItemsTexts(source, "mt-course", null),
    resolveItemInItemsTexts(source, "mt-course"),
  );
  assert.deepEqual(
    resolveItemInItemsTexts(source, "mt-course", {}),
    resolveItemInItemsTexts(source, "mt-course"),
  );
});

test("clampRatingMax keeps whole in-range values and defaults null/NaN to 5", () => {
  assert.equal(clampRatingMax(7), 7);
  assert.equal(clampRatingMax(10), 10);
  assert.equal(clampRatingMax(null), 5);
  assert.equal(clampRatingMax(undefined), 5);
  assert.equal(clampRatingMax(Number.NaN), 5);
});

test("clampRatingMax rounds fractional values and clamps out-of-range ones", () => {
  assert.equal(clampRatingMax(4.6), 5);
  assert.equal(clampRatingMax(1), 2);
  assert.equal(clampRatingMax(0), 2);
  assert.equal(clampRatingMax(25), 20);
});

const ratingSource: RatingLabelSource = {
  ratingLabels: {
    1: "Beginner",
    5: "Advanced",
  },
  ratingCategoryLabels: {
    "cat-japanese": {
      1: "N5",
      2: "",
      5: "N1",
    },
  },
};

test("resolveRatingLevelLabel: a non-blank category override wins over the base label", () => {
  assert.equal(resolveRatingLevelLabel(ratingSource, 1, "cat-japanese"), "N5");
  assert.equal(resolveRatingLevelLabel(ratingSource, 5, "cat-japanese"), "N1");
});

test("resolveRatingLevelLabel: a blank/absent override level inherits the base label", () => {
  // "2" is blank in the override and unlabelled in the base → null (caller shows the number).
  assert.equal(resolveRatingLevelLabel(ratingSource, 2, "cat-japanese"), null);
  // "1" for a category with no override row falls back to the base label.
  assert.equal(resolveRatingLevelLabel(ratingSource, 1, "cat-other"), "Beginner");
  assert.equal(resolveRatingLevelLabel(ratingSource, 1, null), "Beginner");
  assert.equal(resolveRatingLevelLabel(ratingSource, 1), "Beginner");
});

test("resolveRatingLevelLabel: no override and no base label resolves to null", () => {
  assert.equal(resolveRatingLevelLabel(ratingSource, 3, "cat-japanese"), null);
  assert.equal(resolveRatingLevelLabel({
    ratingLabels: null,
    ratingCategoryLabels: null,
  }, 1, "cat-japanese"), null);
});
