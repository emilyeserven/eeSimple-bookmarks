// @vitest-environment node
import type { ExtensionFillRuleGroup, WebsiteExtensionFillRule } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import {
  addGroup,
  applyOverrides,
  assignRuleToGroup,
  canNest,
  clearGroupOverride,
  deleteGroup,
  effectiveOverrides,
  groupDepth,
  lockedKeysForRule,
  materializeAll,
  removeRuleFromGroup,
  renameGroup,
  reorderRuleWithinGroup,
  resolveGroupChain,
  setGroupOverride,
  setGroupParent,
} from "./extensionFillGroups";

function rule(overrides: Partial<WebsiteExtensionFillRule> = {}): WebsiteExtensionFillRule {
  return {
    id: "r1",
    label: "Rule",
    target: {
      kind: "field",
      field: "title",
    },
    extract: {
      selector: ".x",
    },
    ...overrides,
  };
}

function group(overrides: Partial<ExtensionFillRuleGroup> & Pick<ExtensionFillRuleGroup, "id">): ExtensionFillRuleGroup {
  return {
    label: "Group",
    overrides: {},
    ...overrides,
  };
}

describe("resolveGroupChain / effectiveOverrides", () => {
  const outer = group({
    id: "outer",
    overrides: {
      pathMatch: {
        mode: "prefix",
        value: "/course/",
      },
    },
  });
  const inner = group({
    id: "inner",
    parentId: "outer",
    overrides: {
      "target.kind": "customProperty",
    },
  });
  const groups = [outer, inner];

  it("returns the chain root-first, capped at two tiers", () => {
    expect(resolveGroupChain(groups, "inner").map(g => g.id)).toEqual(["outer", "inner"]);
    expect(resolveGroupChain(groups, "outer").map(g => g.id)).toEqual(["outer"]);
    expect(resolveGroupChain(groups, undefined)).toEqual([]);
  });

  it("merges root→leaf with the inner group winning a shared key", () => {
    const conflicting = [
      group({
        id: "outer",
        overrides: {
          "target.kind": "field",
        },
      }),
      group({
        id: "inner",
        parentId: "outer",
        overrides: {
          "target.kind": "customProperty",
        },
      }),
    ];
    expect(effectiveOverrides(conflicting, "inner")["target.kind"]).toBe("customProperty");
  });

  it("unions distinct keys across both tiers", () => {
    const merged = effectiveOverrides(groups, "inner");
    expect(merged.pathMatch).toEqual({
      mode: "prefix",
      value: "/course/",
    });
    expect(merged["target.kind"]).toBe("customProperty");
  });
});

describe("applyOverrides", () => {
  it("swaps the target kind via coerceFillTarget", () => {
    const out = applyOverrides(rule(), {
      "target.kind": "customProperty",
    });
    expect(out.target).toEqual({
      kind: "customProperty",
      propertyId: "",
    });
  });

  it("applies target.kind before per-kind keys so the propertyId survives", () => {
    const out = applyOverrides(rule(), {
      "target.kind": "customProperty",
      "customProperty.propertyId": "p1",
    });
    expect(out.target).toEqual({
      kind: "customProperty",
      propertyId: "p1",
    });
  });

  it("skips a per-kind override when the target kind does not match", () => {
    // No target.kind override, and the rule is a `field` target — propertyId is not applicable.
    const out = applyOverrides(rule(), {
      "customProperty.propertyId": "p1",
    });
    expect(out.target).toEqual({
      kind: "field",
      field: "title",
    });
  });

  it("materializes pathMatch", () => {
    const out = applyOverrides(rule(), {
      pathMatch: {
        mode: "contains",
        value: "/x/",
      },
    });
    expect(out.pathMatch).toEqual({
      mode: "contains",
      value: "/x/",
    });
  });

  it("replaces the whole sections layout bundle", () => {
    const base = rule({
      target: {
        kind: "sections",
        propertyId: "sp",
        entryType: "name",
        container: "old",
      },
    });
    const out = applyOverrides(base, {
      "sections.layout": {
        sectionHeaderSelector: ".h",
      },
    });
    expect(out.target).toEqual({
      kind: "sections",
      propertyId: "sp",
      entryType: "name",
      sectionHeaderSelector: ".h",
    });
  });
});

describe("lockedKeysForRule", () => {
  it("locks the union of applicable overrides across both tiers", () => {
    const groups = [
      group({
        id: "outer",
        overrides: {
          pathMatch: {
            mode: "prefix",
            value: "/c/",
          },
        },
      }),
      group({
        id: "inner",
        parentId: "outer",
        overrides: {
          "target.kind": "customProperty",
          "customProperty.propertyId": "p1",
        },
      }),
    ];
    const member = applyOverrides(rule({
      groupId: "inner",
    }), effectiveOverrides(groups, "inner"));
    const locked = lockedKeysForRule(groups, member);
    expect([...locked].sort()).toEqual(["customProperty.propertyId", "pathMatch", "target.kind"].sort());
  });

  it("excludes an override that no longer applies to the rule's target", () => {
    const groups = [group({
      id: "g",
      overrides: {
        "customProperty.propertyId": "p1",
      },
    })];
    // Rule stayed a `field` target, so the customProperty override is inapplicable → not locked.
    expect(lockedKeysForRule(groups, rule({
      groupId: "g",
    })).size).toBe(0);
  });
});

describe("assignRuleToGroup / removeRuleFromGroup", () => {
  const groups = [group({
    id: "g",
    overrides: {
      pathMatch: {
        mode: "prefix",
        value: "/c/",
      },
    },
  })];

  it("overwrites the rule's values with the group's on join", () => {
    const rules = [rule({
      id: "r1",
      pathMatch: {
        mode: "regex",
        value: "own",
      },
    })];
    const [joined] = assignRuleToGroup(groups, rules, "r1", "g");
    expect(joined.groupId).toBe("g");
    expect(joined.pathMatch).toEqual({
      mode: "prefix",
      value: "/c/",
    });
  });

  it("keeps the materialized value and clears groupId on remove", () => {
    const rules = assignRuleToGroup(groups, [rule({
      id: "r1",
    })], "r1", "g");
    const [removed] = removeRuleFromGroup(rules, "r1");
    expect("groupId" in removed).toBe(false);
    expect(removed.pathMatch).toEqual({
      mode: "prefix",
      value: "/c/",
    });
  });

  it("positions the joined rule before the target rule", () => {
    const rules = [rule({
      id: "a",
      groupId: "g",
    }), rule({
      id: "b",
      groupId: "g",
    }), rule({
      id: "c",
    })];
    const next = assignRuleToGroup(groups, rules, "c", "g", "b");
    expect(next.map(r => r.id)).toEqual(["a", "c", "b"]);
  });
});

describe("reorderRuleWithinGroup", () => {
  it("moves a rule before another without changing membership", () => {
    const rules = [rule({
      id: "a",
    }), rule({
      id: "b",
    }), rule({
      id: "c",
    })];
    expect(reorderRuleWithinGroup(rules, "c", "a").map(r => r.id)).toEqual(["c", "a", "b"]);
  });
});

describe("materializeAll", () => {
  it("re-applies group overrides to members and leaves ungrouped rules untouched", () => {
    const groups = [group({
      id: "g",
      overrides: {
        pathMatch: {
          mode: "prefix",
          value: "/c/",
        },
      },
    })];
    const rules = [rule({
      id: "a",
      groupId: "g",
    }), rule({
      id: "b",
    })];
    const [a, b] = materializeAll(groups, rules);
    expect(a.pathMatch).toEqual({
      mode: "prefix",
      value: "/c/",
    });
    expect(b.pathMatch).toBeUndefined();
  });
});

describe("group CRUD", () => {
  it("adds, renames, sets and clears overrides", () => {
    const {
      groups, id,
    } = addGroup([], "Courses");
    expect(groups).toHaveLength(1);
    const named = renameGroup(groups, id, "Renamed");
    expect(named[0].label).toBe("Renamed");
    const withOverride = setGroupOverride(named, id, "pathMatch", {
      mode: "prefix",
      value: "/c/",
    });
    expect(withOverride[0].overrides.pathMatch).toEqual({
      mode: "prefix",
      value: "/c/",
    });
    const cleared = clearGroupOverride(withOverride, id, "pathMatch");
    expect(cleared[0].overrides.pathMatch).toBeUndefined();
  });

  it("deleteGroup promotes children and detaches members keeping values", () => {
    const groups = [
      group({
        id: "outer",
        overrides: {
          pathMatch: {
            mode: "prefix",
            value: "/c/",
          },
        },
      }),
      group({
        id: "inner",
        parentId: "outer",
      }),
    ];
    const rules = materializeAll(groups, [rule({
      id: "r1",
      groupId: "outer",
    })]);
    const result = deleteGroup(groups, rules, "outer");
    expect(result.groups.map(g => g.id)).toEqual(["inner"]);
    expect(result.groups[0].parentId).toBeUndefined();
    expect("groupId" in result.rules[0]).toBe(false);
    expect(result.rules[0].pathMatch).toEqual({
      mode: "prefix",
      value: "/c/",
    });
  });
});

describe("two-tier nesting guard", () => {
  it("reports depth and rejects illegal nesting", () => {
    const groups = [
      group({
        id: "a",
      }),
      group({
        id: "b",
      }),
      group({
        id: "child",
        parentId: "b",
      }),
    ];
    expect(groupDepth(groups, "a")).toBe(1);
    expect(groupDepth(groups, "child")).toBe(2);
    // b already has a child → nesting a under b would make a a grandchild home → allowed only if a has no children
    expect(canNest(groups, "a", "b")).toBe(true);
    // Nesting under a nested group (child, depth 2) would exceed two tiers.
    expect(canNest(groups, "a", "child")).toBe(false);
    // A group with children cannot itself be nested.
    expect(canNest(groups, "b", "a")).toBe(false);
    // Self-nesting is rejected.
    expect(canNest(groups, "a", "a")).toBe(false);
  });

  it("setGroupParent nests when legal and is a no-op when illegal", () => {
    const groups = [group({
      id: "a",
    }), group({
      id: "b",
    })];
    expect(setGroupParent(groups, "a", "b").find(g => g.id === "a")?.parentId).toBe("b");
    const nested = [group({
      id: "a",
    }), group({
      id: "b",
    }), group({
      id: "c",
      parentId: "b",
    })];
    // c is depth 2 → cannot become a parent.
    expect(setGroupParent(nested, "a", "c")).toEqual(nested);
  });
});
