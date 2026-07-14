import { describe, expect, it } from "vitest";

import { groupWorkbench } from "./group";
import { groupTypeWorkbench } from "./groupType";
import { languageWorkbench } from "./language";
import { locationRelationWorkbench } from "./locationRelation";
import { personWorkbench } from "./person";
import { placeTypeWorkbench } from "./placeType";
import { relationshipTypeWorkbench } from "./relationshipType";
import { shape } from "./workbenchLayoutTestUtils";

/**
 * Byte-identical rollout-batch-1 check (#1164): each "simple flat entity" field registry must resolve
 * its code default layout to the exact same tab / section / field-key order — in both view and edit —
 * as its pre-migration opaque panes. Mirrors `pilotLayouts.test.tsx` via the shared `shape` helper
 * (`workbenchLayoutTestUtils.ts`). Renderers are never invoked here, only the pure order/visibility
 * helpers, so no React rendering happens.
 */

// The General composites of these config entities were atomized into granular fields (#1371, the
// media-type #1189 recipe). The unified field order is shared; the mode filters which render (edit-only
// `name`/flag fields drop in view; view-only metadata rows drop in edit), so the view and edit
// projections of the General tab now differ.

describe("language default layout (#1371)", () => {
  it("renders the granular General view fields (name/genreMoods edit-only, so they drop)", () => {
    expect(shape(languageWorkbench, "view")).toEqual([{
      key: "general",
      group: undefined,
      sections: [{
        key: "general",
        fields: ["slug", "isoCode", "description", "bookmarks", "builtIn", "added"],
      }],
    }]);
  });

  it("renders the granular General edit fields (view-only metadata drops)", () => {
    expect(shape(languageWorkbench, "edit")).toEqual([{
      key: "general",
      group: undefined,
      sections: [{
        key: "general",
        fields: ["name", "isoCode", "description", "genreMoods"],
      }],
    }]);
  });
});

describe("placeType default layout (#1371)", () => {
  it("renders the granular General view fields (name edit-only, so it drops)", () => {
    expect(shape(placeTypeWorkbench, "view")).toEqual([{
      key: "general",
      group: undefined,
      sections: [{
        key: "general",
        fields: ["added", "slug", "sortOrder", "locations", "description", "map"],
      }],
    }]);
  });

  it("renders the granular General edit fields (view-only metadata drops)", () => {
    expect(shape(placeTypeWorkbench, "edit")).toEqual([{
      key: "general",
      group: undefined,
      sections: [{
        key: "general",
        fields: ["name", "sortOrder", "description"],
      }],
    }]);
  });
});

describe("locationRelation default layout (#1371)", () => {
  it("renders both view tabs (bookmarks + granular general)", () => {
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
          fields: ["added", "slug", "sortOrder", "bookmarkCount", "builtIn", "description"],
        }],
      },
    ]);
  });

  it("renders only the granular general edit tab (bookmarks is view-only, so it vanishes in edit)", () => {
    expect(shape(locationRelationWorkbench, "edit")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["name", "sortOrder", "description"],
        }],
      },
    ]);
  });
});

describe("group default layout", () => {
  // The General composite was atomized into granular fields (#1195). The unified field order is shared;
  // the mode filters which render — `name`/`genreMoods` are edit-only, `metadata` is view-only — so the
  // view and edit projections of the General tab differ.
  const otherTabs = [
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

  it("renders the granular General view fields (name/genreMoods are edit-only, so they drop)", () => {
    expect(shape(groupWorkbench, "view")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: [
            "image",
            "metadata",
            "description",
            "primaryLanguage",
            "names",
            "groupType",
            "labeledWebsites",
            "connectedYoutubeChannels",
            "socialLinks",
            "creatorMedia",
          ],
        }],
      },
      ...otherTabs,
    ]);
  });

  it("renders the granular General edit fields (metadata is view-only, so it drops)", () => {
    expect(shape(groupWorkbench, "edit")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: [
            "image",
            "name",
            "description",
            "primaryLanguage",
            "names",
            "groupType",
            "labeledWebsites",
            "connectedYoutubeChannels",
            "socialLinks",
            "creatorMedia",
            "genreMoods",
          ],
        }],
      },
      ...otherTabs,
    ]);
  });
});

describe("groupType default layout (#1371)", () => {
  it("renders the granular General view fields (name edit-only, so it drops)", () => {
    expect(shape(groupTypeWorkbench, "view")).toEqual([{
      key: "general",
      group: undefined,
      sections: [{
        key: "general",
        fields: ["added", "slug", "sortOrder", "description", "groups"],
      }],
    }]);
  });

  it("renders the granular General edit fields (view-only metadata drops)", () => {
    expect(shape(groupTypeWorkbench, "edit")).toEqual([{
      key: "general",
      group: undefined,
      sections: [{
        key: "general",
        fields: ["name", "sortOrder", "description"],
      }],
    }]);
  });
});

describe("relationshipType default layout (#1371)", () => {
  it("renders both view tabs (relationships + granular general)", () => {
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
          fields: ["slug", "description", "directional", "bookmarkCount", "relationshipCount", "builtIn", "added"],
        }],
      },
    ]);
  });

  it("renders only the granular general edit tab (relationships is view-only, so it vanishes in edit)", () => {
    expect(shape(relationshipTypeWorkbench, "edit")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: ["name", "description", "directional"],
        }],
      },
    ]);
  });
});

describe("person default layout", () => {
  // The four specialized tabs are one field each and identical in both modes; only the extracted
  // General tab (#1194) differs by mode — `genreMoods` is edit-only, `metadata`/`connections` view-only.
  const otherTabs = [
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

  it("renders the General view tab with the granular view fields (edit-only genreMoods dropped)", () => {
    expect(shape(personWorkbench, "view")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: [
            "avatar",
            "details",
            "primaryLanguage",
            "names",
            "labeledWebsites",
            "socialLinks",
            "creatorMedia",
            "metadata",
            "connections",
          ],
        }],
      },
      ...otherTabs,
    ]);
  });

  it("renders the General edit tab with the granular edit fields (view-only metadata/connections dropped)", () => {
    expect(shape(personWorkbench, "edit")).toEqual([
      {
        key: "general",
        group: undefined,
        sections: [{
          key: "general",
          fields: [
            "avatar",
            "details",
            "primaryLanguage",
            "names",
            "labeledWebsites",
            "socialLinks",
            "creatorMedia",
            "genreMoods",
          ],
        }],
      },
      ...otherTabs,
    ]);
  });
});
