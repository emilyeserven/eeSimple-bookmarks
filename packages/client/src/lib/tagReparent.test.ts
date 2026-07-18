// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  buildReparentPrompt,
  describeReparentResult,
  normalizeReparentPlan,
  parseReparentText,
} from "./tagReparent";

const parent = {
  id: "parent-1",
  name: "Frameworks",
};
const subtree = [
  {
    id: "id-1",
    path: "React",
  },
  {
    id: "id-2",
    path: "React / Hooks",
  },
];

describe("buildReparentPrompt", () => {
  it("includes the parent context, each subtag id in brackets, and the JSON instruction", () => {
    const prompt = buildReparentPrompt("Reorganize these.", parent, subtree, "");
    expect(prompt).toContain("Reorganize these.");
    expect(prompt).toContain("[parent-1] Frameworks");
    expect(prompt).toContain("- [id-1] React");
    expect(prompt).toContain("- [id-2] React / Hooks");
    expect(prompt).toContain("\"newTags\"");
    expect(prompt).toContain("\"moves\"");
  });

  it("includes the goals block only when notes are present", () => {
    expect(buildReparentPrompt("T", parent, subtree, "")).not.toContain("goals for the reorganization");
    const withNotes = buildReparentPrompt("T", parent, subtree, "group the tooling");
    expect(withNotes).toContain("goals for the reorganization");
    expect(withNotes).toContain("group the tooling");
  });

  it("shows a placeholder when there are no subtags", () => {
    expect(buildReparentPrompt("T", parent, [], "")).toContain("(No subtags yet)");
  });
});

describe("normalizeReparentPlan", () => {
  it("accepts a valid { newTags, moves } object", () => {
    const plan = normalizeReparentPlan({
      newTags: [{
        tempId: "new-1",
        name: "Frontend",
        parentId: null,
      }],
      moves: [{
        id: "id-1",
        parentId: "new-1",
      }],
    });
    expect(plan).toEqual({
      newTags: [{
        tempId: "new-1",
        name: "Frontend",
        parentId: null,
      }],
      moves: [{
        id: "id-1",
        parentId: "new-1",
      }],
    });
  });

  it("treats missing arrays as empty", () => {
    expect(normalizeReparentPlan({
      moves: [{
        id: "id-1",
        parentId: null,
      }],
    })).toEqual({
      newTags: [],
      moves: [{
        id: "id-1",
        parentId: null,
      }],
    });
  });

  it("rejects non-objects, arrays, and wrong-typed entries", () => {
    expect(normalizeReparentPlan(null)).toBeNull();
    expect(normalizeReparentPlan([])).toBeNull();
    expect(normalizeReparentPlan({
      moves: [{
        id: 5,
        parentId: null,
      }],
    })).toBeNull();
    expect(normalizeReparentPlan({
      newTags: [{
        tempId: "x",
        name: "y",
        parentId: 1,
      }],
    })).toBeNull();
  });
});

describe("parseReparentText", () => {
  it("classifies empty, unparseable, invalid, and ok", () => {
    expect(parseReparentText("").kind).toBe("empty");
    expect(parseReparentText("not json").kind).toBe("error");
    expect(parseReparentText("[1,2]").kind).toBe("invalid");
    const ok = parseReparentText("{ \"moves\": [{ \"id\": \"a\", \"parentId\": null }] }");
    expect(ok.kind).toBe("ok");
    expect(ok.kind === "ok" && ok.plan.moves).toHaveLength(1);
  });
});

describe("describeReparentResult", () => {
  it("summarizes moved, created, and skipped counts", () => {
    expect(describeReparentResult({
      created: 2,
      moved: 3,
      notFound: ["x"],
    })).toBe("Moved 3 tags, created 2 tags, 1 skipped");
    expect(describeReparentResult({
      created: 0,
      moved: 1,
      notFound: [],
    })).toBe("Moved 1 tag");
  });
});
