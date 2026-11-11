// @vitest-environment node
import type { MymindImportCard, MymindImportInput, MymindImportOptions } from "@eesimple/types";

import { describe, expect, it } from "vitest";

import { runMymindImport } from "./mymindImportRunner";

const OPTIONS: MymindImportOptions = {
  nestPrefixedTags: true,
  applyAutofill: true,
  keepCreatedDate: true,
  matchMediaTypes: true,
  categoryId: null,
};

function card(n: number): MymindImportCard {
  return {
    mymindIds: [`id${n}`],
    type: "WebPage",
    title: `Card ${n}`,
    url: `https://example.test/${n}`,
    description: null,
    tags: [],
    createdAt: null,
  };
}

describe("runMymindImport", () => {
  it("sends batches in order, aggregates outcomes, and reports progress", async () => {
    const sent: number[] = [];
    const progress: [number, number][] = [];
    const summary = await runMymindImport(
      [card(1), card(2), card(3)],
      OPTIONS,
      async (input: MymindImportInput) => {
        sent.push(input.cards.length);
        return {
          createdTagCount: 1,
          results: input.cards.map(c => ({
            title: c.title,
            url: c.url,
            outcome: c.title === "Card 2" ? "duplicate" as const : "created" as const,
            bookmarkId: "b",
            error: null,
          })),
        };
      },
      (done, total) => progress.push([done, total]),
      2,
    );
    expect(sent).toEqual([2, 1]);
    expect(progress).toEqual([[2, 3], [3, 3]]);
    expect(summary).toMatchObject({
      created: 2,
      duplicates: 1,
      failed: 0,
      createdTagCount: 2,
    });
  });

  it("marks a failed batch's cards as failed and keeps going", async () => {
    let calls = 0;
    const summary = await runMymindImport([card(1), card(2)], OPTIONS, async (input) => {
      calls++;
      if (calls === 1) throw new Error("boom");
      return {
        createdTagCount: 0,
        results: input.cards.map(c => ({
          title: c.title,
          url: c.url,
          outcome: "created" as const,
          bookmarkId: "b",
          error: null,
        })),
      };
    }, undefined, 1);
    expect(summary.failed).toBe(1);
    expect(summary.created).toBe(1);
    expect(summary.results[0]?.error).toBe("boom");
  });
});
