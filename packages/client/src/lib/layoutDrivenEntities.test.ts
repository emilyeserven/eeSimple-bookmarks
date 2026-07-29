// (Default jsdom environment: the module builds workbenches from the entity-descriptor registry.)
import { LAYOUTABLE_ENTITY_KINDS } from "@eesimple/types";
import { describe, expect, it } from "vitest";

import { baseWorkbenchForKind, LAYOUT_DRIVEN_ENTITIES } from "./layoutDrivenEntities";

describe("LAYOUT_DRIVEN_ENTITIES", () => {
  it("lists exactly the LAYOUTABLE_ENTITY_KINDS (set equality — the editor picker can't drift)", () => {
    const pickerKinds = LAYOUT_DRIVEN_ENTITIES.map(entity => entity.kind).sort();
    expect(pickerKinds).toEqual([...LAYOUTABLE_ENTITY_KINDS].sort());
  });

  it("has no duplicate kinds", () => {
    const kinds = LAYOUT_DRIVEN_ENTITIES.map(entity => entity.kind);
    expect(new Set(kinds).size).toBe(kinds.length);
  });

  it("gives every kind a non-empty label", () => {
    for (const entity of LAYOUT_DRIVEN_ENTITIES) {
      expect(entity.label, `kind ${entity.kind} needs a label`).toBeTruthy();
    }
  });

  it("resolves a base workbench for every listed kind", () => {
    for (const entity of LAYOUT_DRIVEN_ENTITIES) {
      expect(baseWorkbenchForKind(entity.kind), `kind ${entity.kind} needs a base workbench`).toBeDefined();
    }
  });
});
