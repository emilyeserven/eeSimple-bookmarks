import assert from "node:assert/strict";
import { mock, test } from "node:test";
import type {
  Bookmark,
  BookmarkUrlDuplicateResult,
  CustomProperty,
  Website,
  WebsiteExtensionFillRule,
} from "@eesimple/types";

// getExtensionFillContext is pure composition over other services — each is mocked here as a seam
// (their own internals are covered by their own test files / the `what-not-to-test` skill), so this
// suite only exercises the mode resolution + referenced-only trimming this file owns.

let duplicateResult: BookmarkUrlDuplicateResult = {
  exactMatch: null,
  pathMatch: null,
  identityMatches: [],
};
let pendingImportItem: { id: string } | null = null;
let bookmarkById: Record<string, Bookmark> = {};
let websiteForUrl: Website | null = null;
let allCustomProperties: CustomProperty[] = [];
let chaptersPropertyId: string | null = null;
const allTaxonomyOptions = {
  people: [{
    id: "person-1",
    name: "Ada Lovelace",
  }],
  groups: [{
    id: "group-1",
    name: "The Beatles",
  }],
  locations: [{
    id: "location-1",
    name: "Paris",
  }],
  tags: [{
    id: "tag-1",
    name: "cooking",
  }],
};

// Full-record fixtures for the `taxonomyEntity` association loaders (getWebsite / listPeople / …).
interface TermFixture {
  id: string;
  name?: string;
  siteName?: string;
  description?: string | null;
  socialLinks?: { platform: string;
    url: string; }[];
  year?: number | null;
  groupIds?: string[];
  websiteIds?: string[];
  youtubeChannelIds?: string[];
}
let peopleList: TermFixture[] = [];
let groupsList: TermFixture[] = [];
let tagsList: TermFixture[] = [];
let locationsList: TermFixture[] = [];
let categoriesList: TermFixture[] = [];
let mediaTypesList: TermFixture[] = [];
let websiteRecords: Record<string, TermFixture> = {};
let websitesCompact: { id: string;
  name: string; }[] = [];
let youtubeChannelsCompact: { id: string;
  name: string; }[] = [];
let languagesList: { id: string;
  name: string;
  isoCode: string | null; }[] = [];
let usageLevelsList: { id: string;
  name: string;
  kind: string; }[] = [];
// Keyed by `${ownerType}:${ownerId}` → the denormalized LanguageUsage[] shape getLanguageUsages returns.
let languageUsagesByOwner: Record<string, { language: { id: string };
  level: { id: string }; }[]> = {};

mock.module("@/services/bookmarks", {
  namedExports: {
    checkBookmarkUrlDuplicate: async () => duplicateResult,
    getBookmark: async (id: string) => bookmarkById[id] ?? null,
  },
});
mock.module("@/services/customProperties", {
  namedExports: {
    listCustomProperties: async () => allCustomProperties,
    getChaptersPropertyId: async () => chaptersPropertyId,
  },
});
mock.module("@/services/imports", {
  namedExports: {
    findPendingImportItemByUrl: async () => pendingImportItem,
  },
});
mock.module("@/services/categories", {
  namedExports: {
    listCategories: async () => categoriesList,
  },
});
mock.module("@/services/mediaTypes", {
  namedExports: {
    listMediaTypes: async () => mediaTypesList,
  },
});
mock.module("@/services/newsletters", {
  namedExports: {
    getNewsletter: async () => null,
  },
});
mock.module("@/services/youtubeChannels", {
  namedExports: {
    getYouTubeChannel: async () => null,
    listYouTubeChannelsCompact: async () => youtubeChannelsCompact,
  },
});
mock.module("@/services/languages", {
  namedExports: {
    listLanguages: async () => languagesList,
  },
});
mock.module("@/services/languageUsageLevels", {
  namedExports: {
    listLanguageUsageLevels: async (kind?: string) =>
      (kind ? usageLevelsList.filter(l => l.kind === kind) : usageLevelsList),
  },
});
mock.module("@/services/languageUsages", {
  namedExports: {
    getLanguageUsages: async (ownerType: string, ownerId: string) =>
      languageUsagesByOwner[`${ownerType}:${ownerId}`] ?? [],
  },
});
mock.module("@/services/websites", {
  namedExports: {
    getWebsite: async (id: string) => websiteRecords[id] ?? null,
    listWebsitesCompact: async () => websitesCompact,
    lookupWebsiteByUrl: async () => ({
      domain: null,
      website: websiteForUrl,
      shortener: null,
    }),
    // Faithful seam for the real migration (its own correctness is covered in websites.test.ts):
    // convert a retired `pathSuffix` gate to a `suffix` pathMatch, else return null (no change).
    migrateExtensionFillRules: (rules: (WebsiteExtensionFillRule & { pathSuffix?: string })[]) => {
      let changed = false;
      const migrated = rules.map((rule) => {
        const {
          pathSuffix, ...rest
        } = rule;
        if (pathSuffix === undefined) return rule;
        changed = true;
        const trimmed = pathSuffix.trim();
        if (!trimmed || rest.pathMatch) return rest;
        return {
          ...rest,
          pathMatch: {
            mode: "suffix",
            value: trimmed,
          },
        };
      });
      return changed ? migrated : null;
    },
  },
});
mock.module("@/services/people", {
  namedExports: {
    listPeopleCompact: async () => allTaxonomyOptions.people,
    listPeople: async () => peopleList,
  },
});
mock.module("@/services/groups", {
  namedExports: {
    listGroupsCompact: async () => allTaxonomyOptions.groups,
    listGroups: async () => groupsList,
    getGroupById: async (id: string) => groupsList.find(g => g.id === id) ?? null,
  },
});
mock.module("@/services/locations", {
  namedExports: {
    listLocationsCompact: async () => allTaxonomyOptions.locations,
    listLocations: async () => locationsList,
  },
});
mock.module("@/services/tags", {
  namedExports: {
    listTagsCompact: async () => allTaxonomyOptions.tags,
    listTags: async () => tagsList,
  },
});

const {
  getExtensionFillContext,
} = await import("@/services/extensionFill");

function resetFixtures(): void {
  duplicateResult = {
    exactMatch: null,
    pathMatch: null,
    identityMatches: [],
  };
  pendingImportItem = null;
  bookmarkById = {};
  websiteForUrl = null;
  allCustomProperties = [];
  chaptersPropertyId = null;
  peopleList = [];
  groupsList = [];
  tagsList = [];
  locationsList = [];
  categoriesList = [];
  mediaTypesList = [];
  websiteRecords = {};
  websitesCompact = [];
  youtubeChannelsCompact = [];
  languagesList = [];
  usageLevelsList = [];
  languageUsagesByOwner = {};
}

function makeWebsite(extensionFillRules: WebsiteExtensionFillRule[]): Website {
  return {
    id: "website-1",
    domain: "example.com",
    siteName: "Example",
    slug: "example",
    extensionFillRules,
  } as unknown as Website;
}

function makeRule(overrides: Partial<WebsiteExtensionFillRule>): WebsiteExtensionFillRule {
  return {
    id: "rule-1",
    label: "Pages",
    target: {
      kind: "field",
      field: "title",
    },
    extract: {
      selector: ".x",
    },
    ...overrides,
  };
}

test("mode is 'bookmark' when the URL matches an existing bookmark", async () => {
  resetFixtures();
  duplicateResult = {
    exactMatch: {
      id: "bm-1",
      url: "https://example.com/a",
      title: "A",
    },
    pathMatch: null,
    identityMatches: [],
  };
  bookmarkById = {
    "bm-1": {
      id: "bm-1",
      title: "A",
    } as unknown as Bookmark,
  };
  const result = await getExtensionFillContext("https://example.com/a");
  assert.equal(result.mode, "bookmark");
  assert.equal(result.bookmark?.id, "bm-1");
});

test("mode is 'bookmark' with no rules/properties/taxonomies when the matched website has no rules", async () => {
  resetFixtures();
  duplicateResult = {
    exactMatch: {
      id: "bm-1",
      url: "https://example.com/a",
      title: "A",
    },
    pathMatch: null,
    identityMatches: [],
  };
  bookmarkById = {
    "bm-1": {
      id: "bm-1",
      title: "A",
    } as unknown as Bookmark,
  };
  websiteForUrl = makeWebsite([]);
  const result = await getExtensionFillContext("https://example.com/a");
  assert.equal(result.mode, "bookmark");
  assert.equal(result.website, undefined);
  assert.equal(result.properties, undefined);
  assert.equal(result.taxonomies, undefined);
});

test("injects the built-in YouTube chapters rule for a saved YouTube video once the Chapters property is seeded", async () => {
  resetFixtures();
  duplicateResult = {
    exactMatch: {
      id: "bm-yt",
      url: "https://www.youtube.com/watch?v=D5L_wKT3OSQ",
      title: "A video",
    },
    pathMatch: null,
    identityMatches: [],
  };
  bookmarkById = {
    "bm-yt": {
      id: "bm-yt",
      title: "A video",
    } as unknown as Bookmark,
  };
  // No stored youtube.com rules, but the Chapters property is seeded → the synthetic rule appears.
  websiteForUrl = null;
  chaptersPropertyId = "chapters-prop";
  allCustomProperties = [
    {
      id: "chapters-prop",
      name: "Chapters",
      slug: "chapters",
      type: "sections",
    } as unknown as CustomProperty,
  ];
  const result = await getExtensionFillContext("https://www.youtube.com/watch?v=D5L_wKT3OSQ");
  assert.equal(result.mode, "bookmark");
  const rules = result.website?.extensionFillRules ?? [];
  assert.equal(rules.length, 1);
  assert.equal(rules[0].id, "builtin-youtube-chapters");
  assert.equal(rules[0].target.kind, "sections");
  assert.equal(rules[0].target.kind === "sections" && rules[0].target.entryType, "timestamp");
  // The referenced Chapters property is shipped to the popup.
  assert.equal(result.properties?.length, 1);
  assert.equal(result.properties?.[0].id, "chapters-prop");
});

test("does not inject the YouTube chapters rule before the Chapters property is seeded", async () => {
  resetFixtures();
  duplicateResult = {
    exactMatch: {
      id: "bm-yt",
      url: "https://www.youtube.com/watch?v=D5L_wKT3OSQ",
      title: "A video",
    },
    pathMatch: null,
    identityMatches: [],
  };
  bookmarkById = {
    "bm-yt": {
      id: "bm-yt",
      title: "A video",
    } as unknown as Bookmark,
  };
  websiteForUrl = null;
  chaptersPropertyId = null;
  const result = await getExtensionFillContext("https://www.youtube.com/watch?v=D5L_wKT3OSQ");
  assert.equal(result.mode, "bookmark");
  assert.equal(result.website, undefined);
});

test("mode is 'inbox' with the pending item's id when the URL has no bookmark match but is pending in the inbox", async () => {
  resetFixtures();
  pendingImportItem = {
    id: "import-item-1",
  };
  const result = await getExtensionFillContext("https://example.com/pending");
  assert.equal(result.mode, "inbox");
  assert.equal(result.bookmark, undefined);
  // The popup needs the pending item id to promote it via "Move to Bookmarks".
  assert.equal(result.inboxItemId, "import-item-1");
});

test("mode is 'unknown' when the URL matches neither a bookmark nor a pending inbox item", async () => {
  resetFixtures();
  const result = await getExtensionFillContext("https://example.com/never-seen");
  assert.equal(result.mode, "unknown");
  assert.equal(result.inboxItemId, undefined);
});

test("properties are trimmed to only those referenced by the website's rules, excluding image/file types", async () => {
  resetFixtures();
  duplicateResult = {
    exactMatch: {
      id: "bm-1",
      url: "https://example.com/a",
      title: "A",
    },
    pathMatch: null,
    identityMatches: [],
  };
  bookmarkById = {
    "bm-1": {
      id: "bm-1",
      title: "A",
    } as unknown as Bookmark,
  };
  allCustomProperties = [
    {
      id: "prop-referenced",
      name: "Pages",
      slug: "pages",
      type: "number",
    } as unknown as CustomProperty,
    {
      id: "prop-unreferenced",
      name: "Notes",
      slug: "notes",
      type: "text",
    } as unknown as CustomProperty,
    {
      id: "prop-image",
      name: "Cover",
      slug: "cover",
      type: "image",
    } as unknown as CustomProperty,
  ];
  websiteForUrl = makeWebsite([
    makeRule({
      id: "r1",
      target: {
        kind: "customProperty",
        propertyId: "prop-referenced",
      },
    }),
    // Rules can reference file/image property targets too — they must never surface in the response.
    makeRule({
      id: "r2",
      target: {
        kind: "customProperty",
        propertyId: "prop-image",
      },
    }),
  ]);

  const result = await getExtensionFillContext("https://example.com/a");
  assert.equal(result.mode, "bookmark");
  assert.deepEqual(result.properties?.map(p => p.id), ["prop-referenced"]);
});

test("an image-only rule surfaces the website rules with no properties/taxonomies", async () => {
  resetFixtures();
  duplicateResult = {
    exactMatch: {
      id: "bm-1",
      url: "https://example.com/a",
      title: "A",
    },
    pathMatch: null,
    identityMatches: [],
  };
  bookmarkById = {
    "bm-1": {
      id: "bm-1",
      title: "A",
    } as unknown as Bookmark,
  };
  websiteForUrl = makeWebsite([
    makeRule({
      id: "r1",
      target: {
        kind: "image",
        setMain: true,
      },
      extract: {
        selector: "img.cover",
        read: {
          kind: "attr",
          name: "src",
        },
      },
    }),
  ]);

  const result = await getExtensionFillContext("https://example.com/a");
  assert.equal(result.mode, "bookmark");
  assert.equal(result.website?.extensionFillRules.length, 1);
  assert.equal(result.website?.extensionFillRules[0]?.target.kind, "image");
  assert.equal(result.properties, undefined);
  assert.equal(result.taxonomies, undefined);
});

test("a rule stored with the retired pathSuffix gate is normalized to a suffix pathMatch before returning", async () => {
  resetFixtures();
  duplicateResult = {
    exactMatch: {
      id: "bm-1",
      url: "https://example.com/course/abc",
      title: "A",
    },
    pathMatch: null,
    identityMatches: [],
  };
  bookmarkById = {
    "bm-1": {
      id: "bm-1",
      title: "A",
    } as unknown as Bookmark,
  };
  websiteForUrl = makeWebsite([
    // A legacy row that predates the boot backfill — gated only by `pathSuffix`, no `pathMatch`.
    makeRule({
      id: "legacy",
      pathSuffix: "/course/",
    } as Partial<WebsiteExtensionFillRule>),
  ]);

  const result = await getExtensionFillContext("https://example.com/course/abc");
  assert.equal(result.mode, "bookmark");
  const rule = result.website?.extensionFillRules[0] as
    (WebsiteExtensionFillRule & { pathSuffix?: string }) | undefined;
  assert.deepEqual(rule?.pathMatch, {
    mode: "suffix",
    value: "/course/",
  });
  // The retired field must not survive into the popup's data (it only reads `pathMatch`).
  assert.equal(rule?.pathSuffix, undefined);
});

test("taxonomies are trimmed to only the kinds referenced by the website's rules", async () => {
  resetFixtures();
  duplicateResult = {
    exactMatch: {
      id: "bm-1",
      url: "https://example.com/a",
      title: "A",
    },
    pathMatch: null,
    identityMatches: [],
  };
  bookmarkById = {
    "bm-1": {
      id: "bm-1",
      title: "A",
    } as unknown as Bookmark,
  };
  websiteForUrl = makeWebsite([
    makeRule({
      id: "r1",
      target: {
        kind: "taxonomy",
        taxonomy: "tags",
      },
    }),
  ]);

  const result = await getExtensionFillContext("https://example.com/a");
  assert.equal(result.mode, "bookmark");
  assert.deepEqual(result.taxonomies?.tags, allTaxonomyOptions.tags);
  assert.equal(result.taxonomies?.people, undefined);
  assert.equal(result.taxonomies?.groups, undefined);
  assert.equal(result.taxonomies?.locations, undefined);
});

test("associatedTerms carries the linked terms (with field values) for referenced taxonomyEntity associations", async () => {
  resetFixtures();
  duplicateResult = {
    exactMatch: {
      id: "bm-1",
      url: "https://example.com/a",
      title: "A",
    },
    pathMatch: null,
    identityMatches: [],
  };
  bookmarkById = {
    "bm-1": {
      id: "bm-1",
      title: "A",
      categoryId: "cat-1",
      website: {
        id: "website-1",
        siteName: "Example",
      },
      people: [
        {
          id: "person-1",
          name: "Ada Lovelace",
        },
        {
          id: "person-2",
          name: "Grace Hopper",
        },
      ],
    } as unknown as Bookmark,
  };
  websiteRecords = {
    "website-1": {
      id: "website-1",
      siteName: "Example",
      description: "A site",
      socialLinks: [{
        platform: "x",
        url: "https://x.com/example",
      }],
    },
  };
  peopleList = [
    {
      id: "person-1",
      name: "Ada Lovelace",
      description: "Mathematician",
      socialLinks: [],
    },
    {
      id: "person-2",
      name: "Grace Hopper",
      description: null,
      socialLinks: [],
    },
    {
      id: "person-3",
      name: "Unlinked",
      description: "not linked to this bookmark",
    },
  ];
  websiteForUrl = makeWebsite([
    makeRule({
      id: "r1",
      target: {
        kind: "taxonomyEntity",
        association: "people",
        field: "description",
      },
    }),
    makeRule({
      id: "r2",
      target: {
        kind: "taxonomyEntity",
        association: "website",
        field: "socialLink",
        socialPlatform: "x",
      },
    }),
  ]);

  const result = await getExtensionFillContext("https://example.com/a");
  assert.equal(result.mode, "bookmark");
  // Only the two linked people are sent (person-3 is excluded), each with its current description.
  assert.deepEqual(result.associatedTerms?.people, [
    {
      id: "person-1",
      name: "Ada Lovelace",
      description: "Mathematician",
      socialLinks: [],
    },
    {
      id: "person-2",
      name: "Grace Hopper",
      description: null,
      socialLinks: [],
    },
  ]);
  // The single linked website carries its name/description/socialLinks.
  assert.deepEqual(result.associatedTerms?.website, [
    {
      id: "website-1",
      name: "Example",
      description: "A site",
      socialLinks: [{
        platform: "x",
        url: "https://x.com/example",
      }],
    },
  ]);
  // Associations no rule references are omitted.
  assert.equal(result.associatedTerms?.groups, undefined);
});

test("associatedTerms omits an association whose bookmark has no linked term", async () => {
  resetFixtures();
  duplicateResult = {
    exactMatch: {
      id: "bm-1",
      url: "https://example.com/a",
      title: "A",
    },
    pathMatch: null,
    identityMatches: [],
  };
  bookmarkById = {
    "bm-1": {
      id: "bm-1",
      title: "A",
      categoryId: "cat-1",
      groups: [],
    } as unknown as Bookmark,
  };
  websiteForUrl = makeWebsite([
    makeRule({
      id: "r1",
      target: {
        kind: "taxonomyEntity",
        association: "groups",
        field: "description",
      },
    }),
  ]);

  const result = await getExtensionFillContext("https://example.com/a");
  assert.equal(result.mode, "bookmark");
  // No linked groups → the whole associatedTerms map is absent (popup shows a disabled "no linked" row).
  assert.equal(result.associatedTerms, undefined);
});

test("a relation target hydrates the term's relation ids + loads only the referenced relation option list", async () => {
  resetFixtures();
  duplicateResult = {
    exactMatch: {
      id: "bm-1",
      url: "https://example.com/a",
      title: "A",
    },
    pathMatch: null,
    identityMatches: [],
  };
  bookmarkById = {
    "bm-1": {
      id: "bm-1",
      title: "A",
      people: [{
        id: "person-1",
        name: "Ada Lovelace",
      }],
    } as unknown as Bookmark,
  };
  peopleList = [
    {
      id: "person-1",
      name: "Ada Lovelace",
      description: "Mathematician",
      socialLinks: [],
      groupIds: ["group-1"],
      websiteIds: ["w-1"],
    },
  ];
  websitesCompact = [{
    id: "w-1",
    name: "Example",
  }];
  websiteForUrl = makeWebsite([
    makeRule({
      id: "r1",
      target: {
        kind: "taxonomyEntity",
        association: "people",
        field: "relation:groups",
      },
    }),
  ]);

  const result = await getExtensionFillContext("https://example.com/a");
  assert.equal(result.mode, "bookmark");
  // The linked person carries its current groupIds (for union), but NOT websiteIds (that relation
  // isn't referenced by any rule).
  assert.deepEqual(result.associatedTerms?.people, [
    {
      id: "person-1",
      name: "Ada Lovelace",
      description: "Mathematician",
      socialLinks: [],
      groupIds: ["group-1"],
    },
  ]);
  // Only the referenced relation's option list is loaded.
  assert.deepEqual(result.relationOptions?.groups, allTaxonomyOptions.groups);
  assert.equal(result.relationOptions?.websites, undefined);
  assert.equal(result.relationOptions?.youtubeChannels, undefined);
  // No language target → no language block.
  assert.equal(result.languages, undefined);
  assert.equal(result.primaryLanguageLevelId, undefined);
});

test("a language target loads the languages list + primary level id and hydrates the term's usages", async () => {
  resetFixtures();
  duplicateResult = {
    exactMatch: {
      id: "bm-1",
      url: "https://example.com/a",
      title: "A",
    },
    pathMatch: null,
    identityMatches: [],
  };
  bookmarkById = {
    "bm-1": {
      id: "bm-1",
      title: "A",
      website: {
        id: "website-1",
        siteName: "Example",
      },
    } as unknown as Bookmark,
  };
  websiteRecords = {
    "website-1": {
      id: "website-1",
      siteName: "Example",
      description: "A site",
      socialLinks: [],
    },
  };
  languagesList = [{
    id: "lang-en",
    name: "English",
    isoCode: "en",
  }];
  usageLevelsList = [
    {
      id: "level-primary",
      name: "Primary Language",
      kind: "availability",
    },
    {
      id: "level-dub",
      name: "Dub",
      kind: "availability",
    },
  ];
  languageUsagesByOwner = {
    "website:website-1": [{
      language: {
        id: "lang-en",
      },
      level: {
        id: "level-primary",
      },
    }],
  };
  websiteForUrl = makeWebsite([
    makeRule({
      id: "r1",
      target: {
        kind: "taxonomyEntity",
        association: "website",
        field: "language",
      },
      extract: {
        source: "meta",
        metaKey: "og:locale",
      },
    }),
  ]);

  const result = await getExtensionFillContext("https://example.com/a");
  assert.equal(result.mode, "bookmark");
  assert.deepEqual(result.languages, [{
    id: "lang-en",
    name: "English",
    isoCode: "en",
  }]);
  assert.equal(result.primaryLanguageLevelId, "level-primary");
  // The linked website term carries its current language usages (compact) for the merge.
  assert.deepEqual(result.associatedTerms?.website?.[0].languageUsages, [{
    languageId: "lang-en",
    usageLevelId: "level-primary",
  }]);
});

test("a language target reports primaryLanguageLevelId: null when no Primary Language level exists", async () => {
  resetFixtures();
  duplicateResult = {
    exactMatch: {
      id: "bm-1",
      url: "https://example.com/a",
      title: "A",
    },
    pathMatch: null,
    identityMatches: [],
  };
  bookmarkById = {
    "bm-1": {
      id: "bm-1",
      title: "A",
      website: {
        id: "website-1",
        siteName: "Example",
      },
    } as unknown as Bookmark,
  };
  websiteRecords = {
    "website-1": {
      id: "website-1",
      siteName: "Example",
      description: null,
      socialLinks: [],
    },
  };
  languagesList = [];
  usageLevelsList = [{
    id: "level-dub",
    name: "Dub",
    kind: "availability",
  }];
  websiteForUrl = makeWebsite([
    makeRule({
      id: "r1",
      target: {
        kind: "taxonomyEntity",
        association: "website",
        field: "language",
      },
    }),
  ]);

  const result = await getExtensionFillContext("https://example.com/a");
  assert.equal(result.mode, "bookmark");
  // The block is present (a language rule exists) but the level couldn't be resolved.
  assert.deepEqual(result.languages, []);
  assert.equal(result.primaryLanguageLevelId, null);
});
