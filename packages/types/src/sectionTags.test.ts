import assert from "node:assert/strict";
import { test } from "node:test";

import type { SectionEntry } from "./customProperties.js";

import { reassignSectionTagIds } from "./sectionTags.js";

/** A minimal tier-1 section entry with optional tags/children. */
function entry(
  id: string,
  tagIds?: string[],
  children?: SectionEntry[],
): SectionEntry {
  return {
    id,
    name: id,
    type: "page",
    startValue: "",
    ...(tagIds
      ? {
        tagIds,
      }
      : {}),
    ...(children
      ? {
        children,
      }
      : {}),
  };
}

test("reassignSectionTagIds replaces an entry's tag id with the target", () => {
  const sections = [entry("s1", ["from"])];
  const result = reassignSectionTagIds(sections, new Set(["from"]), "to");
  assert.deepEqual(result[0]?.tagIds, ["to"]);
});

test("reassignSectionTagIds replaces a child's tag id", () => {
  const sections = [entry("s1", undefined, [entry("c1", ["from"])])];
  const result = reassignSectionTagIds(sections, new Set(["from"]), "to");
  assert.deepEqual(result[0]?.children?.[0]?.tagIds, ["to"]);
});

test("reassignSectionTagIds dedups when the target is already present", () => {
  const sections = [entry("s1", ["from", "to", "keep"])];
  const result = reassignSectionTagIds(sections, new Set(["from"]), "to");
  assert.deepEqual(result[0]?.tagIds, ["to", "keep"]);
});

test("reassignSectionTagIds maps multiple ids in the from-set to the same target", () => {
  const sections = [entry("s1", ["a", "b", "keep"])];
  const result = reassignSectionTagIds(sections, new Set(["a", "b"]), "to");
  assert.deepEqual(result[0]?.tagIds, ["to", "keep"]);
});

test("reassignSectionTagIds returns the same array reference when nothing matches", () => {
  const sections = [entry("s1", ["keep"]), entry("s2")];
  const result = reassignSectionTagIds(sections, new Set(["from"]), "to");
  assert.equal(result, sections);
});

test("reassignSectionTagIds leaves entries without tagIds untouched", () => {
  const sections = [entry("s1", ["from"]), entry("s2")];
  const result = reassignSectionTagIds(sections, new Set(["from"]), "to");
  assert.deepEqual(result[0]?.tagIds, ["to"]);
  assert.equal(result[1]?.tagIds, undefined);
  // The untouched entry keeps its exact reference.
  assert.equal(result[1], sections[1]);
});

test("reassignSectionTagIds handles a mix of entry- and child-tier matches", () => {
  const sections = [
    entry("s1", ["from"], [entry("c1", ["keep"]), entry("c2", ["from", "to"])]),
  ];
  const result = reassignSectionTagIds(sections, new Set(["from"]), "to");
  assert.deepEqual(result[0]?.tagIds, ["to"]);
  assert.deepEqual(result[0]?.children?.[0]?.tagIds, ["keep"]);
  assert.deepEqual(result[0]?.children?.[1]?.tagIds, ["to"]);
});
