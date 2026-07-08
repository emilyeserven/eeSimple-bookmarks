import { describe, expect, it } from "vitest";

import { genreMoodWorkbench } from "./genreMood";
import { groupWorkbench } from "./group";
import { groupTypeWorkbench } from "./groupType";
import { languageWorkbench } from "./language";
import { locationRelationWorkbench } from "./locationRelation";
import { personWorkbench } from "./person";
import { placeTypeWorkbench } from "./placeType";
import { propertyGroupWorkbench } from "./propertyGroup";
import { relationshipTypeWorkbench } from "./relationshipType";
import { shape } from "./workbenchLayoutTestUtils";

/**
 * Byte-identical rollout-batch-1 check (#1164): each "simple flat entity" field registry must resolve
 * its code default layout to the exact same tab / section / field-key order — in both view and edit —
 * as its pre-migration opaque panes. Mirrors `pilotLayouts.test.tsx` via the shared `shape` helper
 * (`workbenchLayoutTestUtils.ts`). Renderers are never invoked here, only the pure order/visibility
 * helpers, so no React rendering happens.
 */

describe("genreMood default layout", () => {
  it("renders both view tabs (general, hierarchy)", () => {
    expect(shape(genreMoodWorkbench, "view")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["general"],
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

  it("renders only the general edit tab (hierarchy is view-only, so it vanishes in edit)", () => {
    expect(shape(genreMoodWorkbench, "edit")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["general"],
        }],
      },
    ]);
  });
});

describe("language default layout", () => {
  it("renders the single view/edit tab", () => {
    const expected = [{
      key: "general",
      group: undefined,
      sections: [{
        key: "general",
        fields: ["general"],
      }],
    }];
    expect(shape(languageWorkbench, "view")).toEqual(expected);
    expect(shape(languageWorkbench, "edit")).toEqual(expected);
  });
});

describe("placeType default layout", () => {
  it("renders the single view/edit tab", () => {
    const expected = [{
      key: "general",
      group: undefined,
      sections: [{
        key: "general",
        fields: ["general"],
      }],
    }];
    expect(shape(placeTypeWorkbench, "view")).toEqual(expected);
    expect(shape(placeTypeWorkbench, "edit")).toEqual(expected);
  });
});

describe("locationRelation default layout", () => {
  it("renders both view tabs (bookmarks, general)", () => {
    expect(shape(locationRelationWorkbench, "view")).toEqual([
      {
        key: "bookmarks",
        group: undefined,
        sections: [{
          key: "bookmarks",
          fields: ["bookmarks"],
        }],
      },
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["general"],
        }],
      },
    ]);
  });

  it("renders only the general edit tab (bookmarks is view-only, so it vanishes in edit)", () => {
    expect(shape(locationRelationWorkbench, "edit")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["general"],
        }],
      },
    ]);
  });
});

describe("propertyGroup default layout", () => {
  it("renders all four tabs identically in both modes", () => {
    const expected = [
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["general"],
        }],
      },
      {
        key: "categories",
        group: undefined,
        sections: [{
          key: "categories",
          fields: ["categories"],
        }],
      },
      {
        key: "media-types",
        group: undefined,
        sections: [{
          key: "media-types",
          fields: ["mediaTypes"],
        }],
      },
      {
        key: "display-rules",
        group: undefined,
        sections: [{
          key: "display-rules",
          fields: ["displayRules"],
        }],
      },
    ];
    expect(shape(propertyGroupWorkbench, "view")).toEqual(expected);
    expect(shape(propertyGroupWorkbench, "edit")).toEqual(expected);
  });
});

describe("group default layout", () => {
  it("renders all four tabs identically in both modes", () => {
    const expected = [
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["general"],
        }],
      },
      {
        key: "people",
        group: undefined,
        sections: [{
          key: "people",
          fields: ["people"],
        }],
      },
      {
        key: "youtube-channels",
        group: undefined,
        sections: [{
          key: "youtube-channels",
          fields: ["youtubeChannels"],
        }],
      },
      {
        key: "websites",
        group: undefined,
        sections: [{
          key: "websites",
          fields: ["websites"],
        }],
      },
    ];
    expect(shape(groupWorkbench, "view")).toEqual(expected);
    expect(shape(groupWorkbench, "edit")).toEqual(expected);
  });
});

describe("groupType default layout", () => {
  it("renders the single view/edit tab", () => {
    const expected = [{
      key: "general",
      group: undefined,
      sections: [{
        key: "general",
        fields: ["general"],
      }],
    }];
    expect(shape(groupTypeWorkbench, "view")).toEqual(expected);
    expect(shape(groupTypeWorkbench, "edit")).toEqual(expected);
  });
});

describe("relationshipType default layout", () => {
  it("renders both view tabs (relationships, general)", () => {
    expect(shape(relationshipTypeWorkbench, "view")).toEqual([
      {
        key: "relationships",
        group: undefined,
        sections: [{
          key: "relationships",
          fields: ["relationships"],
        }],
      },
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["general"],
        }],
      },
    ]);
  });

  it("renders only the general edit tab (relationships is view-only, so it vanishes in edit)", () => {
    expect(shape(relationshipTypeWorkbench, "edit")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["general"],
        }],
      },
    ]);
  });
});

describe("person default layout", () => {
  it("renders all five tabs identically in both modes", () => {
    const expected = [
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["general"],
        }],
      },
      {
        key: "youtube-channels",
        group: undefined,
        sections: [{
          key: "youtube-channels",
          fields: ["youtubeChannels"],
        }],
      },
      {
        key: "websites",
        group: undefined,
        sections: [{
          key: "websites",
          fields: ["websites"],
        }],
      },
      {
        key: "groups",
        group: undefined,
        sections: [{
          key: "groups",
          fields: ["groups"],
        }],
      },
      {
        key: "languages",
        group: undefined,
        sections: [{
          key: "languages",
          fields: ["languages"],
        }],
      },
    ];
    expect(shape(personWorkbench, "view")).toEqual(expected);
    expect(shape(personWorkbench, "edit")).toEqual(expected);
  });
});
