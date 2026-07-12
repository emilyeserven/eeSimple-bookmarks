// @vitest-environment node
import { describe, expect, it } from "vitest";

import { computePersonGroupGaps } from "./personGroupGaps";
import { makePerson } from "../test-utils/factories";

describe("computePersonGroupGaps", () => {
  const alice = makePerson({
    id: "a",
    name: "Alice",
    groupIds: ["g1"],
  });
  const bob = makePerson({
    id: "b",
    name: "Bob",
    groupIds: [],
  });

  it("returns nothing when there are no credited people or groups", () => {
    expect(computePersonGroupGaps([alice], [], ["g1"])).toEqual([]);
    expect(computePersonGroupGaps([alice], ["a"], [])).toEqual([]);
  });

  it("reports each group a credited person is not a member of", () => {
    const gaps = computePersonGroupGaps([alice, bob], ["a", "b"], ["g1", "g2"]);
    expect(gaps).toEqual([
      {
        person: alice,
        missingGroupIds: ["g2"],
      },
      {
        person: bob,
        missingGroupIds: ["g1", "g2"],
      },
    ]);
  });

  it("omits people already in every selected group", () => {
    expect(computePersonGroupGaps([alice], ["a"], ["g1"])).toEqual([]);
  });

  it("skips person ids not found in the people list", () => {
    expect(computePersonGroupGaps([alice], ["missing"], ["g1"])).toEqual([]);
  });
});
