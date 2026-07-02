import assert from "node:assert/strict";
import { test } from "node:test";

import type { OutlineDocLike, OutlineItemLike } from "@/services/pdfToc";

import { outlineToTocEntries } from "@/services/pdfToc";

/** A fake page ref: `getPageIndex` reads the 0-based index straight off the object. */
function ref(index: number): object {
  return {
    pageIndex: index,
  };
}

const stubDoc: OutlineDocLike = {
  // Named destinations resolve "page-<n>" to an explicit array pointing at 0-based page n.
  getDestination: async (id: string) => {
    const match = /^page-(\d+)$/.exec(id);
    if (!match) return null;
    return [ref(Number(match[1]))];
  },
  getPageIndex: async (target: object) => {
    const index = (target as { pageIndex?: unknown }).pageIndex;
    if (typeof index !== "number") throw new Error("bad ref");
    return index;
  },
};

test("outlineToTocEntries resolves string (named) destinations to 1-based pages", async () => {
  const outline: OutlineItemLike[] = [
    {
      title: "Chapter 1",
      dest: "page-0",
    },
    {
      title: "Chapter 2",
      dest: "page-9",
    },
  ];
  assert.deepEqual(await outlineToTocEntries(stubDoc, outline), [
    {
      title: "Chapter 1",
      page: 1,
    },
    {
      title: "Chapter 2",
      page: 10,
    },
  ]);
});

test("outlineToTocEntries resolves explicit array destinations (ref object and plain number)", async () => {
  const outline: OutlineItemLike[] = [
    {
      title: "Ref dest",
      dest: [ref(4), "XYZ"],
    },
    {
      title: "Numeric dest",
      dest: [7, "Fit"],
    },
  ];
  assert.deepEqual(await outlineToTocEntries(stubDoc, outline), [
    {
      title: "Ref dest",
      page: 5,
    },
    {
      title: "Numeric dest",
      page: 8,
    },
  ]);
});

test("outlineToTocEntries flattens exactly two levels in document order", async () => {
  const outline: OutlineItemLike[] = [
    {
      title: "Part I",
      dest: "page-0",
      items: [
        {
          title: "Chapter 1",
          dest: "page-2",
          items: [
            {
              // Level 3 — dropped.
              title: "Section 1.1",
              dest: "page-3",
            },
          ],
        },
        {
          title: "Chapter 2",
          dest: "page-8",
        },
      ],
    },
    {
      title: "Part II",
      dest: "page-19",
    },
  ];
  assert.deepEqual((await outlineToTocEntries(stubDoc, outline)).map(e => e.title), [
    "Part I",
    "Chapter 1",
    "Chapter 2",
    "Part II",
  ]);
});

test("outlineToTocEntries skips unresolvable, throwing, and untitled entries", async () => {
  const outline: OutlineItemLike[] = [
    {
      title: "Unknown named dest",
      dest: "not-a-page",
    },
    {
      title: "Null dest",
      dest: null,
    },
    {
      title: "Empty explicit dest",
      dest: [],
    },
    {
      title: "Throwing ref",
      dest: [{}],
    },
    {
      title: "   ",
      dest: "page-1",
    },
    {
      title: "Survivor",
      dest: "page-5",
    },
  ];
  assert.deepEqual(await outlineToTocEntries(stubDoc, outline), [
    {
      title: "Survivor",
      page: 6,
    },
  ]);
});
