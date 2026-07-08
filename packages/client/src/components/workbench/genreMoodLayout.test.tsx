import { describe, expect, it } from "vitest";

import { genreMoodWorkbench } from "./genreMood";
import { shape } from "./workbenchLayoutTestUtils";

/**
 * The #1190 genreMood analogue of `bookmarkLayout.test.tsx`: the former single composite `general`
 * field was split into granular fields (name/description/parent/stats/primaryLanguage/names/
 * relatedGenreMoods), so this is no longer a byte-identical rollout-batch-1 snapshot (see the removed
 * block in `rolloutBatch1Layouts.test.tsx`) — it snapshots the new field-order shape directly.
 * Renderers are never invoked, only the pure order/visibility helpers.
 */

describe("genreMood default layout", () => {
  it("renders the view tabs + field order (edit-only fields dropped)", () => {
    expect(shape(genreMoodWorkbench, "view")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["stats", "primaryLanguage", "names"],
        }],
      },
      {
        key: "hierarchy",
        group: undefined,
        sections: [{
          key: "hierarchy",
          fields: ["hierarchy"],
        }],
      },
    ]);
  });

  it("renders the edit tabs + field order (view-only stats/hierarchy dropped, Hierarchy tab vanishes)", () => {
    expect(shape(genreMoodWorkbench, "edit")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["name", "description", "primaryLanguage", "names", "parent", "relatedGenreMoods"],
        }],
      },
    ]);
  });
});
