// @vitest-environment node
import { describe, expect, it } from "vitest";

import { classifyPeopleNames } from "./peopleMatchOrCreate";

describe("classifyPeopleNames", () => {
  const existing = [
    {
      id: "1",
      name: "Neil Gaiman",
    },
    {
      id: "2",
      name: "Terry Pratchett",
    },
  ];

  it("marks an existing person (case-insensitive) as reused", () => {
    expect(classifyPeopleNames(["neil gaiman"], existing)).toEqual([
      {
        name: "neil gaiman",
        existing: true,
      },
    ]);
  });

  it("marks an unknown name as new", () => {
    expect(classifyPeopleNames(["Ursula K. Le Guin"], existing)).toEqual([
      {
        name: "Ursula K. Le Guin",
        existing: false,
      },
    ]);
  });

  it("preserves order and classifies a mixed list", () => {
    expect(classifyPeopleNames(["Ada Lovelace", "Terry Pratchett"], existing)).toEqual([
      {
        name: "Ada Lovelace",
        existing: false,
      },
      {
        name: "Terry Pratchett",
        existing: true,
      },
    ]);
  });

  it("treats every name as new when there are no existing people", () => {
    expect(classifyPeopleNames(["Neil Gaiman"], [])).toEqual([
      {
        name: "Neil Gaiman",
        existing: false,
      },
    ]);
  });
});
