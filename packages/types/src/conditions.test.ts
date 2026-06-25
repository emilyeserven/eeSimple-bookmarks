import assert from "node:assert/strict";
import { test } from "node:test";

import type { ConditionInput, ConditionNode } from "./conditions.js";

import {
  buildTagDescendants,
  emptyConditionTree,
  evaluateConditions,
  normalizeDomain,
} from "./conditions.js";

function makeInput(overrides: Partial<ConditionInput> = {}): ConditionInput {
  return {
    url: "https://example.com/article",
    title: "An Example Article",
    categoryId: "cat-1",
    tagIds: new Set(),
    youtubeChannelId: null,
    mediaTypeId: null,
    relationshipTypeIds: new Set(),
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
