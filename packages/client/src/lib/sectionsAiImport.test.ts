// @vitest-environment node
import type { TagNode } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import {
  buildSectionsImportPrompt,
  classifySuggestedTags,
  parseSectionsImportText,
  renderTagSubtree,
  resolveNewTagPlan,
  wireSectionsToEntries,
} from "./sectionsAiImport";

function tagNode(name: string, children: TagNode[] = []): TagNode {
  return {
    id: `id-${name}`,
    name,
    slug: name,
    description: null,
    parentId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    children,
  };
}

/** A deterministic id factory for stable assertions. */
function sequentialIds(): () => string {
  let n = 0;
  return () => `id-${++n}`;
}

describe("renderTagSubtree", () => {
  it("renders the node and its descendants as an indented list", () => {
    const tree = tagNode("programming", [
      tagNode("python", [tagNode("packaging")]),
      tagNode("testing"),
    ]);
    expect(renderTagSubtree(tree)).toBe([
      "- programming",
      "  - python",
      "    - packaging",
      "  - testing",
    ].join("\n"));
  });
});

describe("buildSectionsImportPrompt", () => {
  it("includes the title, subtree, fallback parent, and JSON-only instruction", () => {
    const prompt = buildSectionsImportPrompt({
      bookmarkTitle: "Fluent Python",
      parentTagName: "programming",
      subtreeText: "- programming\n  - python",
    });
    expect(prompt).toContain("\"Fluent Python\"");
    expect(prompt).toContain("- programming\n  - python");
    expect(prompt).toContain("(or \"programming\" as the fallback)");
    expect(prompt).toContain("Respond with ONLY a JSON object");
    expect(prompt).toContain("\"newTags\"");
  });

  it("omits the reuse list when no parent tag is selected, but still allows tags", () => {
    const prompt = buildSectionsImportPrompt({
      bookmarkTitle: null,
      parentTagName: null,
      subtreeText: null,
    });
    expect(prompt).toContain("a book's table of contents");
    expect(prompt).not.toContain("exactly as written");
    expect(prompt).toContain("Tagging rules:");
    expect(prompt).toContain("Respond with ONLY a JSON object");
  });
});

describe("parseSectionsImportText", () => {
  it("returns empty for whitespace and error for unparseable JSON", () => {
    expect(parseSectionsImportText("  ").kind).toBe("empty");
    expect(parseSectionsImportText("not json").kind).toBe("error");
  });

  it("returns invalid for a wrong shape or a section without a name", () => {
    expect(parseSectionsImportText("{\"nope\": true}").kind).toBe("invalid");
    expect(parseSectionsImportText("{\"sections\": [{\"startPage\": 3}]}").kind).toBe("invalid");
  });

  it("accepts a bare array as the sections list", () => {
    const state = parseSectionsImportText("[{\"name\": \"Intro\"}]");
    expect(state).toEqual({
      kind: "ok",
      payload: {
        sections: [{
          name: "Intro",
          tags: [],
        }],
        newTags: [],
      },
    });
  });

  it("strips a wrapping markdown code fence before parsing", () => {
    const state = parseSectionsImportText("```json\n{\"sections\": [{\"name\": \"Intro\"}]}\n```");
    expect(state.kind).toBe("ok");
  });

  it("coerces numeric-string pages, drops non-string tags, and dedupes tags per entry", () => {
    const state = parseSectionsImportText(JSON.stringify({
      sections: [{
        name: "Ch 1",
        startPage: "12",
        endPage: 20.9,
        tags: ["python", 3, "  ", "Python", "web"],
      }],
    }));
    expect(state).toEqual({
      kind: "ok",
      payload: {
        sections: [{
          name: "Ch 1",
          startPage: 12,
          endPage: 20,
          tags: ["python", "web"],
        }],
        newTags: [],
      },
    });
  });

  it("keeps one level of children and silently drops grandchildren", () => {
    const state = parseSectionsImportText(JSON.stringify({
      sections: [{
        name: "Part I",
        children: [{
          name: "Ch 1",
          children: [{
            name: "1.1",
          }],
        }],
      }],
    }));
    expect(state.kind).toBe("ok");
    if (state.kind !== "ok") return;
    expect(state.payload.sections[0].children).toEqual([{
      name: "Ch 1",
      tags: [],
    }]);
  });

  it("normalizes newTags and ignores malformed members", () => {
    const state = parseSectionsImportText(JSON.stringify({
      sections: [],
      newTags: [
        {
          name: " packaging ",
          parent: " python ",
        },
        {
          name: "",
        },
        "junk",
        {
          name: "solo",
          parent: "",
        },
      ],
    }));
    expect(state).toEqual({
      kind: "ok",
      payload: {
        sections: [],
        newTags: [
          {
            name: "packaging",
            parent: "python",
          },
          {
            name: "solo",
          },
        ],
      },
    });
  });
});

describe("classifySuggestedTags", () => {
  const allTags = [
    {
      id: "t-python",
      name: "Python",
    },
    {
      id: "t-web",
      name: "web",
    },
  ];

  it("matches existing tags case-insensitively and dedupes across sections and newTags", () => {
    const items = classifySuggestedTags({
      sections: [
        {
          name: "Ch 1",
          tags: ["python", "packaging"],
          children: [{
            name: "1.1",
            tags: ["PYTHON", "web"],
          }],
        },
      ],
      newTags: [
        {
          name: "Packaging",
          parent: "python",
        },
      ],
    }, allTags);
    expect(items).toEqual([
      {
        name: "python",
        existingTagId: "t-python",
      },
      {
        name: "packaging",
        proposedParentName: "python",
      },
      {
        name: "web",
        existingTagId: "t-web",
      },
    ]);
  });

  it("includes a newTags-only name so it can still be reviewed", () => {
    const items = classifySuggestedTags({
      sections: [],
      newTags: [{
        name: "orphan",
      }],
    }, allTags);
    expect(items).toEqual([{
      name: "orphan",
    }]);
  });
});

describe("resolveNewTagPlan", () => {
  const allTags = [
    {
      id: "t-python",
      name: "Python",
    },
    {
      id: "t-tooling",
      name: "tooling",
    },
  ];

  it("skips rejected names, applies renames, and collapses a rename onto an existing tag", () => {
    const plan = resolveNewTagPlan(
      [
        {
          name: "python",
          existingTagId: "t-python",
        },
        {
          name: "pkging",
          proposedParentName: "python",
        },
        {
          name: "typo-tag",
        },
        {
          name: "toolings",
        },
      ],
      {
        rejected: new Set(["typo-tag"]),
        renames: {
          pkging: "packaging",
          toolings: "Tooling",
        },
      },
      allTags,
      "fallback-id",
    );
    expect(plan.creations).toEqual([{
      finalName: "packaging",
      parent: {
        kind: "existing",
        id: "t-python",
      },
    }]);
    expect(plan.resolution).toEqual({
      python: {
        kind: "existing",
        id: "t-python",
      },
      pkging: {
        kind: "create",
        finalName: "packaging",
      },
      toolings: {
        kind: "existing",
        id: "t-tooling",
      },
    });
  });

  it("orders a new parent before its child and falls back for unknown parents", () => {
    const plan = resolveNewTagPlan(
      [
        {
          name: "leaf",
          proposedParentName: "branch",
        },
        {
          name: "branch",
        },
        {
          name: "stray",
          proposedParentName: "no-such-tag",
        },
      ],
      {
        rejected: new Set(),
        renames: {},
      },
      allTags,
      "fallback-id",
    );
    expect(plan.creations).toEqual([
      {
        finalName: "branch",
        parent: {
          kind: "existing",
          id: "fallback-id",
        },
      },
      {
        finalName: "stray",
        parent: {
          kind: "existing",
          id: "fallback-id",
        },
      },
      {
        finalName: "leaf",
        parent: {
          kind: "new",
          name: "branch",
        },
      },
    ]);
  });

  it("re-parents a rejected parent's child to the fallback", () => {
    const plan = resolveNewTagPlan(
      [
        {
          name: "leaf",
          proposedParentName: "branch",
        },
        {
          name: "branch",
        },
      ],
      {
        rejected: new Set(["branch"]),
        renames: {},
      },
      allTags,
      null,
    );
    expect(plan.creations).toEqual([{
      finalName: "leaf",
      parent: {
        kind: "existing",
        id: null,
      },
    }]);
    expect(plan.resolution.branch).toBeUndefined();
  });

  it("collapses two names renamed to the same final name into one creation", () => {
    const plan = resolveNewTagPlan(
      [
        {
          name: "pkg",
        },
        {
          name: "pkgs",
        },
      ],
      {
        rejected: new Set(),
        renames: {
          pkg: "packaging",
          pkgs: "Packaging",
        },
      },
      allTags,
      null,
    );
    expect(plan.creations).toEqual([{
      finalName: "packaging",
      parent: {
        kind: "existing",
        id: null,
      },
    }]);
    expect(plan.resolution.pkg).toEqual({
      kind: "create",
      finalName: "packaging",
    });
    expect(plan.resolution.pkgs).toEqual({
      kind: "create",
      finalName: "packaging",
    });
  });
});

describe("wireSectionsToEntries", () => {
  const resolve = (name: string): string | undefined =>
    name === "python" ? "t-python" : name === "web" ? "t-web" : undefined;

  it("derives end pages from the next paged sibling, explicit endPage winning", () => {
    const entries = wireSectionsToEntries(
      [
        {
          name: "Ch 1",
          startPage: 1,
          tags: [],
        },
        {
          name: "Interlude",
          tags: [],
        },
        {
          name: "Ch 2",
          startPage: 20,
          endPage: 25,
          tags: [],
        },
        {
          name: "Ch 3",
          startPage: 26,
          tags: [],
        },
      ],
      resolve,
      ["name", "url", "page", "timestamp"],
      sequentialIds(),
    );
    expect(entries.map(e => [e.type, e.startValue, e.endValue])).toEqual([
      ["page", "1", "19"],
      ["name", "", undefined],
      ["page", "20", "25"],
      ["page", "26", undefined],
    ]);
  });

  it("clamps a derived end page so end >= start when siblings share a page", () => {
    const entries = wireSectionsToEntries(
      [
        {
          name: "A",
          startPage: 5,
          tags: [],
        },
        {
          name: "B",
          startPage: 5,
          tags: [],
        },
      ],
      resolve,
      ["page"],
      sequentialIds(),
    );
    expect(entries[0].endValue).toBe("5");
  });

  it("falls back to name-only entries when page is not an allowed type", () => {
    const entries = wireSectionsToEntries(
      [{
        name: "Ch 1",
        startPage: 1,
        endPage: 9,
        tags: [],
      }],
      resolve,
      ["name", "url"],
      sequentialIds(),
    );
    expect(entries[0]).toEqual({
      id: "id-1",
      name: "Ch 1",
      type: "name",
      startValue: "",
    });
  });

  it("attaches resolved tagIds, drops unresolved names, and omits tagIds when empty", () => {
    const entries = wireSectionsToEntries(
      [
        {
          name: "Ch 1",
          startPage: 1,
          tags: ["python", "rejected-tag"],
          children: [{
            name: "1.1",
            startPage: 2,
            tags: ["web"],
          }],
        },
        {
          name: "Ch 2",
          startPage: 10,
          tags: ["rejected-tag"],
        },
      ],
      resolve,
      ["page"],
      sequentialIds(),
    );
    expect(entries[0].tagIds).toEqual(["t-python"]);
    expect(entries[0].children?.[0].tagIds).toEqual(["t-web"]);
    expect(entries[1].tagIds).toBeUndefined();
  });

  it("derives child end pages within the child's own sibling list", () => {
    const entries = wireSectionsToEntries(
      [{
        name: "Part I",
        startPage: 1,
        tags: [],
        children: [
          {
            name: "Ch 1",
            startPage: 3,
            tags: [],
          },
          {
            name: "Ch 2",
            startPage: 11,
            tags: [],
          },
        ],
      }],
      resolve,
      ["page"],
      sequentialIds(),
    );
    expect(entries[0].children?.map(c => [c.startValue, c.endValue])).toEqual([
      ["3", "10"],
      ["11", undefined],
    ]);
  });

  it("uses the injected id factory for deterministic ids", () => {
    const entries = wireSectionsToEntries(
      [{
        name: "Ch 1",
        tags: [],
        children: [{
          name: "1.1",
          tags: [],
        }],
      }],
      resolve,
      ["page"],
      sequentialIds(),
    );
    expect(entries[0].id).toBe("id-1");
    expect(entries[0].children?.[0].id).toBe("id-2");
  });
});
