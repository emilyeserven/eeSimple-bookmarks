import assert from "node:assert/strict";
import { test } from "node:test";
import type { ConditionTree } from "@eesimple/types";
import { migrateDomainMatches } from "@/services/autofill";

test("migrateDomainMatches rewrites legacy domain matches into website leaves", () => {
  const result = migrateDomainMatches({
    type: "group",
    combinator: "and",
    children: [
      {
        type: "match",
        field: "url",
        operator: "domain",
        pattern: "www.101cookbooks.com",
      },
      {
        type: "match",
        field: "title",
        operator: "contains",
        pattern: "ponzu",
      },
    ],
  });
  assert.equal(result.changed, true);
  assert.deepEqual(result.node, {
    type: "group",
    combinator: "and",
    children: [
      {
        type: "website",
        domains: ["101cookbooks.com"],
      },
      {
        type: "match",
        field: "title",
        operator: "contains",
        pattern: "ponzu",
      },
    ],
  });
});

test("migrateDomainMatches leaves trees without a domain match untouched", () => {
  const tree: ConditionTree = {
    type: "group",
    combinator: "and",
    children: [{
      type: "match",
      field: "title",
      operator: "contains",
      pattern: "ponzu",
    }],
  };
  const result = migrateDomainMatches(tree);
  assert.equal(result.changed, false);
  assert.equal(result.node, tree);
});
