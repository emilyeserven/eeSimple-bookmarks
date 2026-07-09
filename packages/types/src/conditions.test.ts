import assert from "node:assert/strict";
import { test } from "node:test";

import type { ConditionInput, ConditionNode } from "./conditions.js";

import {
  buildTaxonomyTermDescendants,
  buildLocationDescendants,
  buildMediaTypeDescendants,
  buildTagDescendants,
  emptyConditionTree,
  evaluateConditions,
  normalizeDomain,
} from "./conditions.js";

/** A three-level parent → child → grandchild tree, shared by the per-item cascade tests. */
const cascadeTree = [
  {
    id: "parent",
    parentId: null,
  },
  {
    id: "child",
    parentId: "parent",
  },
  {
    id: "grandchild",
    parentId: "child",
  },
];

function makeInput(overrides: Partial<ConditionInput> = {}): ConditionInput {
  return {
    url: "https://example.com/article",
    title: "An Example Article",
    categoryId: "cat-1",
    tagIds: new Set(),
    locationIds: new Set(),
    taxonomyTermIds: new Set(),
    youtubeChannelId: null,
    mediaTypeId: null,
    relationshipTypeIds: new Set(),
    languageUsages: [],
    names: [],
    numberValues: new Map(),
    booleanValues: new Map(),
    dateTimeValues: new Map(),
    fileValues: new Set(),
    choicesValues: new Map(),
    sectionsValues: new Map(),
    textValues: new Map(),
    ...overrides,
  };
}

function group(children: ConditionNode[], combinator: "and" | "or" = "and"): ConditionNode {
  return {
    type: "group",
    combinator,
    children,
  };
}

test("an empty group matches nothing", () => {
  assert.equal(evaluateConditions(emptyConditionTree(), makeInput()), false);
});

test("group AND requires every child; OR requires any child", () => {
  const url: ConditionNode = {
    type: "match",
    field: "url",
    operator: "contains",
    pattern: "example",
  };
  const title: ConditionNode = {
    type: "match",
    field: "title",
    operator: "contains",
    pattern: "nope",
  };
  assert.equal(evaluateConditions(group([url, title], "and"), makeInput()), false);
  assert.equal(evaluateConditions(group([url, title], "or"), makeInput()), true);
});

test("match: contains / starts_with are case-insensitive and field-scoped", () => {
  const input = makeInput();
  assert.equal(
    evaluateConditions({
      type: "match",
      field: "title",
      operator: "contains",
      pattern: "EXAMPLE",
    }, input),
    true,
  );
  assert.equal(
    evaluateConditions({
      type: "match",
      field: "title",
      operator: "starts_with",
      pattern: "an example",
    }, input),
    true,
  );
  assert.equal(
    evaluateConditions({
      type: "match",
      field: "title",
      operator: "starts_with",
      pattern: "article",
    }, input),
    false,
  );
});

test("match: the title field also matches a language-labelled name", () => {
  const input = makeInput({
    title: "東京タワー",
    names: ["Tokyo Tower"],
  });
  assert.equal(
    evaluateConditions({
      type: "match",
      field: "title",
      operator: "contains",
      pattern: "tokyo",
    }, input),
    true,
  );
  assert.equal(
    evaluateConditions({
      type: "match",
      field: "title",
      operator: "starts_with",
      pattern: "Tokyo",
    }, input),
    true,
  );
  // The original-script title still matches too.
  assert.equal(
    evaluateConditions({
      type: "match",
      field: "title",
      operator: "contains",
      pattern: "タワー",
    }, input),
    true,
  );
  // A romanized pattern doesn't bleed into the URL field.
  assert.equal(
    evaluateConditions({
      type: "match",
      field: "url",
      operator: "contains",
      pattern: "tokyo",
    }, input),
    false,
  );
});

test("match: the title field matches a non-primary language-labelled name", () => {
  // The base title doesn't contain the pattern — only a `names` entry does.
  const input = makeInput({
    title: "新世紀エヴァンゲリオン",
    names: ["新世紀エヴァンゲリオン", "Neon Genesis Evangelion"],
  });
  assert.equal(
    evaluateConditions({
      type: "match",
      field: "title",
      operator: "contains",
      pattern: "Evangelion",
    }, input),
    true,
  );
  // The native-script name still matches.
  assert.equal(
    evaluateConditions({
      type: "match",
      field: "title",
      operator: "contains",
      pattern: "エヴァンゲリオン",
    }, input),
    true,
  );
});

test("match: an empty pattern never matches", () => {
  assert.equal(
    evaluateConditions({
      type: "match",
      field: "title",
      operator: "contains",
      pattern: "   ",
    }, makeInput()),
    false,
  );
});

test("match: regex matches, and an invalid regex never matches", () => {
  const input = makeInput();
  assert.equal(
    evaluateConditions({
      type: "match",
      field: "title",
      operator: "regex",
      pattern: "ex.mple",
    }, input),
    true,
  );
  assert.equal(
    evaluateConditions({
      type: "match",
      field: "title",
      operator: "regex",
      pattern: "(",
    }, input),
    false,
  );
});

test("match: the domain operator inspects the URL host regardless of field", () => {
  const input = makeInput({
    url: "https://www.Example.com/x",
  });
  assert.equal(
    evaluateConditions({
      type: "match",
      field: "title",
      operator: "domain",
      pattern: "example.com",
    }, input),
    true,
  );
  assert.equal(
    evaluateConditions({
      type: "match",
      field: "title",
      operator: "domain",
      pattern: "other.com",
    }, input),
    false,
  );
});

test("category matches when the bookmark's category is in the list", () => {
  assert.equal(evaluateConditions({
    type: "category",
    categoryIds: ["cat-1", "cat-2"],
  }, makeInput()), true);
  assert.equal(evaluateConditions({
    type: "category",
    categoryIds: ["cat-9"],
  }, makeInput()), false);
});

test("website matches on normalized host; empty list never matches", () => {
  const input = makeInput({
    url: "https://www.Example.com/path",
  });
  assert.equal(evaluateConditions({
    type: "website",
    domains: ["example.com"],
  }, input), true);
  assert.equal(evaluateConditions({
    type: "website",
    domains: ["www.example.com"],
  }, input), true);
  assert.equal(evaluateConditions({
    type: "website",
    domains: [],
  }, input), false);
});

test("tag matches an exact id, and cascades to descendants via the resolver", () => {
  const tags = [
    {
      id: "parent",
      parentId: null,
    },
    {
      id: "child",
      parentId: "parent",
    },
    {
      id: "grandchild",
      parentId: "child",
    },
  ];
  const resolve = buildTagDescendants(tags);
  const input = makeInput({
    tagIds: new Set(["grandchild"]),
  });

  // Without a resolver, only the exact id matches.
  assert.equal(evaluateConditions({
    type: "tag",
    tagIds: ["parent"],
  }, input), false);
  // With cascade, selecting the parent matches a descendant.
  assert.equal(evaluateConditions({
    type: "tag",
    tagIds: ["parent"],
  }, input, {
    tagDescendants: resolve,
  }), true);
  // Empty list never matches.
  assert.equal(evaluateConditions({
    type: "tag",
    tagIds: [],
  }, input, {
    tagDescendants: resolve,
  }), false);
});

test("youtube-channel and media-type match the bookmark's id; empty/null never match", () => {
  const yt = makeInput({
    youtubeChannelId: "chan-1",
  });
  assert.equal(evaluateConditions({
    type: "youtube-channel",
    channelIds: ["chan-1"],
  }, yt), true);
  assert.equal(evaluateConditions({
    type: "youtube-channel",
    channelIds: ["chan-2"],
  }, yt), false);
  assert.equal(evaluateConditions({
    type: "youtube-channel",
    channelIds: ["chan-1"],
  }, makeInput()), false);

  const mt = makeInput({
    mediaTypeId: "video",
  });
  assert.equal(evaluateConditions({
    type: "media-type",
    mediaTypeIds: ["video"],
  }, mt), true);
  assert.equal(evaluateConditions({
    type: "media-type",
    mediaTypeIds: [],
  }, mt), false);
});

test("relationship-type matches on presence of any listed type", () => {
  const input = makeInput({
    relationshipTypeIds: new Set(["rel-a"]),
  });
  assert.equal(evaluateConditions({
    type: "relationship-type",
    relationshipTypeIds: ["rel-a", "rel-b"],
  }, input), true);
  assert.equal(evaluateConditions({
    type: "relationship-type",
    relationshipTypeIds: ["rel-z"],
  }, input), false);
});

test("language-usage matches both constraints on a single association row", () => {
  const input = makeInput({
    languageUsages: [
      {
        languageId: "en",
        usageLevelId: "dub",
      },
      {
        languageId: "es",
        usageLevelId: "subs",
      },
    ],
  });
  // language-only.
  assert.equal(evaluateConditions({
    type: "language-usage",
    languageIds: ["en"],
    usageLevelIds: [],
  }, input), true);
  // level-only.
  assert.equal(evaluateConditions({
    type: "language-usage",
    languageIds: [],
    usageLevelIds: ["subs"],
  }, input), true);
  // both on the same row.
  assert.equal(evaluateConditions({
    type: "language-usage",
    languageIds: ["en"],
    usageLevelIds: ["dub"],
  }, input), true);
  // cross-product must NOT match (English is dubbed, Spanish is subbed — no English subs).
  assert.equal(evaluateConditions({
    type: "language-usage",
    languageIds: ["en"],
    usageLevelIds: ["subs"],
  }, input), false);
  // both empty never matches.
  assert.equal(evaluateConditions({
    type: "language-usage",
    languageIds: [],
    usageLevelIds: [],
  }, input), false);
});

test("genre-mood matches on presence of any listed id; empty never matches", () => {
  const input = makeInput({
    taxonomyTermIds: new Set(["gm-a"]),
  });
  assert.equal(evaluateConditions({
    type: "genre-mood",
    genreMoodIds: ["gm-a", "gm-b"],
  }, input), true);
  assert.equal(evaluateConditions({
    type: "genre-mood",
    genreMoodIds: ["gm-z"],
  }, input), false);
  assert.equal(evaluateConditions({
    type: "genre-mood",
    genreMoodIds: [],
  }, input), false);
});

test("tag per-item cascade flag: only flagged ids match descendants; absent = legacy cascade-all", () => {
  const resolve = buildTagDescendants(cascadeTree);
  const input = makeInput({
    tagIds: new Set(["grandchild"]),
  });

  // Absent cascade set (legacy) → parent still cascades to its subtree, preserving old behavior.
  assert.equal(evaluateConditions({
    type: "tag",
    tagIds: ["parent"],
  }, input, {
    tagDescendants: resolve,
  }), true);
  // Explicit empty cascade set → exact only → the parent no longer matches its grandchild.
  assert.equal(evaluateConditions({
    type: "tag",
    tagIds: ["parent"],
    cascadeTagIds: [],
  }, input, {
    tagDescendants: resolve,
  }), false);
  // Parent flagged to cascade → matches the grandchild again.
  assert.equal(evaluateConditions({
    type: "tag",
    tagIds: ["parent"],
    cascadeTagIds: ["parent"],
  }, input, {
    tagDescendants: resolve,
  }), true);
});

test("location per-item cascade flag mirrors tags (absent = legacy cascade-all)", () => {
  const resolve = buildLocationDescendants(cascadeTree);
  const input = makeInput({
    locationIds: new Set(["child"]),
  });
  assert.equal(evaluateConditions({
    type: "location",
    locationIds: ["parent"],
  }, input, {
    locationDescendants: resolve,
  }), true);
  assert.equal(evaluateConditions({
    type: "location",
    locationIds: ["parent"],
    cascadeLocationIds: [],
  }, input, {
    locationDescendants: resolve,
  }), false);
});

test("media-type per-item cascade: absent = legacy exact; flagged id matches its subtree", () => {
  const resolve = buildMediaTypeDescendants(cascadeTree);
  const input = makeInput({
    mediaTypeId: "grandchild",
  });

  // Absent cascade set (legacy) → exact only → a parent does NOT match a descendant media type.
  assert.equal(evaluateConditions({
    type: "media-type",
    mediaTypeIds: ["parent"],
  }, input, {
    mediaTypeDescendants: resolve,
  }), false);
  // Flagged to cascade → the bookmark's descendant media type now matches.
  assert.equal(evaluateConditions({
    type: "media-type",
    mediaTypeIds: ["parent"],
    cascadeMediaTypeIds: ["parent"],
  }, input, {
    mediaTypeDescendants: resolve,
  }), true);
  // Exact self still matches.
  assert.equal(evaluateConditions({
    type: "media-type",
    mediaTypeIds: ["grandchild"],
    cascadeMediaTypeIds: [],
  }, input, {
    mediaTypeDescendants: resolve,
  }), true);
});

test("genre-mood per-item cascade: absent = legacy exact; flagged id matches its subtree", () => {
  const resolve = buildTaxonomyTermDescendants(cascadeTree);
  const input = makeInput({
    taxonomyTermIds: new Set(["child"]),
  });

  // Absent cascade set (legacy) → exact only → parent does NOT match a descendant genre.
  assert.equal(evaluateConditions({
    type: "genre-mood",
    genreMoodIds: ["parent"],
  }, input, {
    taxonomyTermDescendants: resolve,
  }), false);
  // Flagged to cascade → any descendant present on the bookmark matches.
  assert.equal(evaluateConditions({
    type: "genre-mood",
    genreMoodIds: ["parent"],
    cascadeGenreMoodIds: ["parent"],
  }, input, {
    taxonomyTermDescendants: resolve,
  }), true);
});

test("property number predicate: range bounds and presence", () => {
  const input = makeInput({
    numberValues: new Map([["p", 5]]),
  });
  const inRange: ConditionNode = {
    type: "property",
    propertyId: "p",
    predicate: {
      valueKind: "number",
      predicate: {
        kind: "range",
        min: 1,
        max: 10,
      },
    },
  };
  const outOfRange: ConditionNode = {
    type: "property",
    propertyId: "p",
    predicate: {
      valueKind: "number",
      predicate: {
        kind: "range",
        min: 6,
        max: null,
      },
    },
  };
  assert.equal(evaluateConditions(inRange, input), true);
  assert.equal(evaluateConditions(outOfRange, input), false);

  const missing: ConditionNode = {
    type: "property",
    propertyId: "absent",
    predicate: {
      valueKind: "number",
      predicate: {
        kind: "presence",
        mode: "missing",
      },
    },
  };
  assert.equal(evaluateConditions(missing, input), true);
});

test("property boolean predicate: value match and presence", () => {
  const input = makeInput({
    booleanValues: new Map([["b", true]]),
  });
  const isTrue: ConditionNode = {
    type: "property",
    propertyId: "b",
    predicate: {
      valueKind: "boolean",
      predicate: {
        kind: "value",
        value: true,
      },
    },
  };
  const isFalse: ConditionNode = {
    type: "property",
    propertyId: "b",
    predicate: {
      valueKind: "boolean",
      predicate: {
        kind: "value",
        value: false,
      },
    },
  };
  assert.equal(evaluateConditions(isTrue, input), true);
  assert.equal(evaluateConditions(isFalse, input), false);
});

test("property datetime predicate: inclusive lexical range", () => {
  const input = makeInput({
    dateTimeValues: new Map([["d", "2026-06-15"]]),
  });
  const within: ConditionNode = {
    type: "property",
    propertyId: "d",
    predicate: {
      valueKind: "datetime",
      predicate: {
        kind: "range",
        from: "2026-06-01",
        to: "2026-06-30",
      },
    },
  };
  const before: ConditionNode = {
    type: "property",
    propertyId: "d",
    predicate: {
      valueKind: "datetime",
      predicate: {
        kind: "range",
        from: "2026-07-01",
        to: null,
      },
    },
  };
  assert.equal(evaluateConditions(within, input), true);
  assert.equal(evaluateConditions(before, input), false);
});

test("property file predicate: presence only", () => {
  const input = makeInput({
    fileValues: new Set(["f"]),
  });
  const has: ConditionNode = {
    type: "property",
    propertyId: "f",
    predicate: {
      valueKind: "file",
      predicate: {
        kind: "presence",
        mode: "has",
      },
    },
  };
  const missing: ConditionNode = {
    type: "property",
    propertyId: "g",
    predicate: {
      valueKind: "file",
      predicate: {
        kind: "presence",
        mode: "missing",
      },
    },
  };
  assert.equal(evaluateConditions(has, input), true);
  assert.equal(evaluateConditions(missing, input), true);
});

test("property choices predicate: includes any listed value, and presence", () => {
  const input = makeInput({
    choicesValues: new Map([["c", ["red", "green"]]]),
  });
  const includesMatch: ConditionNode = {
    type: "property",
    propertyId: "c",
    predicate: {
      valueKind: "choices",
      predicate: {
        kind: "includes",
        values: ["blue", "green"],
      },
    },
  };
  const includesMiss: ConditionNode = {
    type: "property",
    propertyId: "c",
    predicate: {
      valueKind: "choices",
      predicate: {
        kind: "includes",
        values: ["blue", "yellow"],
      },
    },
  };
  const presentHas: ConditionNode = {
    type: "property",
    propertyId: "c",
    predicate: {
      valueKind: "choices",
      predicate: {
        kind: "presence",
        mode: "has",
      },
    },
  };
  const presentMissingOnEmpty: ConditionNode = {
    type: "property",
    propertyId: "empty",
    predicate: {
      valueKind: "choices",
      predicate: {
        kind: "presence",
        mode: "missing",
      },
    },
  };
  assert.equal(evaluateConditions(includesMatch, input), true);
  assert.equal(evaluateConditions(includesMiss, input), false);
  assert.equal(evaluateConditions(presentHas, input), true);
  assert.equal(evaluateConditions(presentMissingOnEmpty, input), true);
});

test("property sections predicate: presence, sectionType, and exhaustive", () => {
  const input = makeInput({
    sectionsValues: new Map([["s", {
      propertyId: "s",
      exhaustive: true,
      sections: [{
        id: "x",
        name: "Intro",
        type: "page",
        startValue: "1",
      }],
    }]]),
  });
  const present: ConditionNode = {
    type: "property",
    propertyId: "s",
    predicate: {
      valueKind: "sections",
      predicate: {
        kind: "presence",
        mode: "has",
      },
    },
  };
  const matchingType: ConditionNode = {
    type: "property",
    propertyId: "s",
    predicate: {
      valueKind: "sections",
      predicate: {
        kind: "sectionType",
        types: ["page"],
      },
    },
  };
  const otherType: ConditionNode = {
    type: "property",
    propertyId: "s",
    predicate: {
      valueKind: "sections",
      predicate: {
        kind: "sectionType",
        types: ["timestamp"],
      },
    },
  };
  const exhaustive: ConditionNode = {
    type: "property",
    propertyId: "s",
    predicate: {
      valueKind: "sections",
      predicate: {
        kind: "exhaustive",
        value: true,
      },
    },
  };
  assert.equal(evaluateConditions(present, input), true);
  assert.equal(evaluateConditions(matchingType, input), true);
  assert.equal(evaluateConditions(otherType, input), false);
  assert.equal(evaluateConditions(exhaustive, input), true);
});

test("property text predicate: presence and case-insensitive contains", () => {
  const input = makeInput({
    textValues: new Map([["t", "Hello World"]]),
  });
  const present: ConditionNode = {
    type: "property",
    propertyId: "t",
    predicate: {
      valueKind: "text",
      predicate: {
        kind: "presence",
        mode: "has",
      },
    },
  };
  const missingOnEmpty: ConditionNode = {
    type: "property",
    propertyId: "blank",
    predicate: {
      valueKind: "text",
      predicate: {
        kind: "presence",
        mode: "missing",
      },
    },
  };
  const containsMatch: ConditionNode = {
    type: "property",
    propertyId: "t",
    predicate: {
      valueKind: "text",
      predicate: {
        kind: "contains",
        pattern: "world",
      },
    },
  };
  const containsMiss: ConditionNode = {
    type: "property",
    propertyId: "t",
    predicate: {
      valueKind: "text",
      predicate: {
        kind: "contains",
        pattern: "goodbye",
      },
    },
  };
  assert.equal(evaluateConditions(present, input), true);
  assert.equal(evaluateConditions(missingOnEmpty, input), true);
  assert.equal(evaluateConditions(containsMatch, input), true);
  assert.equal(evaluateConditions(containsMiss, input), false);
});

test("normalizeDomain lowercases and strips a leading www.", () => {
  assert.equal(normalizeDomain("  WWW.Example.COM "), "example.com");
  assert.equal(normalizeDomain("sub.example.com"), "sub.example.com");
});

test("buildTagDescendants is inclusive and tolerates cycles", () => {
  const resolve = buildTagDescendants([
    {
      id: "a",
      parentId: "b",
    },
    {
      id: "b",
      parentId: "a",
    },
  ]);
  const descendants = resolve("a");
  assert.equal(descendants.has("a"), true);
  assert.equal(descendants.has("b"), true);
});

test("location matches an exact id, and cascades to descendants via the resolver", () => {
  const locations = [
    {
      id: "country",
      parentId: null,
    },
    {
      id: "region",
      parentId: "country",
    },
    {
      id: "city",
      parentId: "region",
    },
  ];
  const resolve = buildLocationDescendants(locations);
  const input = makeInput({
    locationIds: new Set(["city"]),
  });

  // Without a resolver, only the exact id matches.
  assert.equal(evaluateConditions({
    type: "location",
    locationIds: ["country"],
  }, input), false);
  // With cascade, selecting the country matches a descendant city.
  assert.equal(evaluateConditions({
    type: "location",
    locationIds: ["country"],
  }, input, {
    locationDescendants: resolve,
  }), true);
  // The exact id still matches with the resolver present.
  assert.equal(evaluateConditions({
    type: "location",
    locationIds: ["city"],
  }, input, {
    locationDescendants: resolve,
  }), true);
  // Empty list never matches.
  assert.equal(evaluateConditions({
    type: "location",
    locationIds: [],
  }, input, {
    locationDescendants: resolve,
  }), false);
});

test("nested groups recurse: an inner group is one child of an outer group", () => {
  const urlMatch: ConditionNode = {
    type: "match",
    field: "url",
    operator: "contains",
    pattern: "example",
  };
  const titleMiss: ConditionNode = {
    type: "match",
    field: "title",
    operator: "contains",
    pattern: "nope",
  };
  const titleMatch: ConditionNode = {
    type: "match",
    field: "title",
    operator: "contains",
    pattern: "example",
  };

  // Inner AND fails (titleMiss), but the sibling leaf makes the outer OR pass.
  assert.equal(
    evaluateConditions(group([group([urlMatch, titleMiss], "and"), urlMatch], "or"), makeInput()),
    true,
  );
  // Inner AND passes (both children match), so the outer AND passes too.
  assert.equal(
    evaluateConditions(group([group([urlMatch, titleMatch], "and"), urlMatch], "and"), makeInput()),
    true,
  );
  // Inner AND fails and it is the only child of an outer AND — the whole tree fails.
  assert.equal(
    evaluateConditions(group([group([urlMatch, titleMiss], "and")], "and"), makeInput()),
    false,
  );
});
