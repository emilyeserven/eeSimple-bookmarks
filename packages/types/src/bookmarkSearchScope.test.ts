import assert from "node:assert/strict";
import { test } from "node:test";

import type { ScopeMatchableBookmark } from "./bookmarkSearchScope.js";

import { bookmarkMatchesScope, validateBookmarkSearchScope } from "./bookmarkSearchScope.js";

function makeScopeBookmark(overrides: Partial<ScopeMatchableBookmark> = {}): ScopeMatchableBookmark {
  return {
    categoryId: null,
    mediaType: null,
    website: null,
    youtubeChannel: null,
    import: null,
    people: [],
    groups: [],
    genreMoods: [],
    locations: [],
    taxonomyTerms: [],
    tags: [],
    sectionsValues: [],
    languageUsages: [],
    ...overrides,
  } as ScopeMatchableBookmark;
}

// Identity resolver — subtree tests inject their own inclusive sets.
const identity = (id: string) => new Set([id]);

test("category scope matches the exact category id", () => {
  const bookmark = makeScopeBookmark({
    categoryId: "cat-1",
  });
  assert.equal(bookmarkMatchesScope(bookmark, {
    kind: "category",
    id: "cat-1",
  }), true);
  assert.equal(bookmarkMatchesScope(bookmark, {
    kind: "category",
    id: "cat-2",
  }), false);
});

test("import scope matches the newsletter issue's import group", () => {
  const bookmark = makeScopeBookmark({
    import: {
      id: "imp-1",
    } as ScopeMatchableBookmark["import"],
  });
  assert.equal(bookmarkMatchesScope(bookmark, {
    kind: "import",
    id: "imp-1",
  }), true);
  assert.equal(bookmarkMatchesScope(bookmark, {
    kind: "import",
    id: "imp-2",
  }), false);
});

test("person scope is an any-match over the credited people", () => {
  const bookmark = makeScopeBookmark({
    people: [{
      id: "p-1",
    }, {
      id: "p-2",
    }] as ScopeMatchableBookmark["people"],
  });
  assert.equal(bookmarkMatchesScope(bookmark, {
    kind: "person",
    id: "p-2",
  }), true);
  assert.equal(bookmarkMatchesScope(bookmark, {
    kind: "person",
    id: "p-3",
  }), false);
});

test("tag scope matches the whole subtree via the resolver", () => {
  const bookmark = makeScopeBookmark({
    tags: [{
      id: "t-child",
    }] as ScopeMatchableBookmark["tags"],
  });
  const resolvers = {
    tagDescendants: (id: string) =>
      id === "t-root" ? new Set(["t-root", "t-child"]) : new Set([id]),
  };
  assert.equal(bookmarkMatchesScope(bookmark, {
    kind: "tag",
    id: "t-root",
  }, resolvers), true);
  // Without a resolver, only the exact id matches.
  assert.equal(bookmarkMatchesScope(bookmark, {
    kind: "tag",
    id: "t-root",
  }), false);
});

test("taggedSections mode replaces membership with section-tag matching (entries and children)", () => {
  const tagged = makeScopeBookmark({
    tags: [{
      id: "t-dev",
    }] as ScopeMatchableBookmark["tags"],
  });
  const sectioned = makeScopeBookmark({
    sectionsValues: [{
      propertyId: "p1",
      exhaustive: false,
      sections: [{
        id: "s1",
        name: "Chapter on dev",
        type: "name",
        startValue: "",
        tagIds: ["t-dev"],
      }],
    }],
  });
  const childSectioned = makeScopeBookmark({
    sectionsValues: [{
      propertyId: "p1",
      exhaustive: false,
      sections: [{
        id: "s1",
        name: "Part I",
        type: "name",
        startValue: "",
        children: [{
          id: "s1a",
          name: "1.1 dev",
          type: "name",
          startValue: "",
          tagIds: ["t-dev"],
        }],
      }],
    }],
  });
  const scope = {
    kind: "tag",
    id: "t-dev",
    taggedSections: true,
  } as const;
  assert.equal(bookmarkMatchesScope(tagged, scope, {
    tagDescendants: identity,
  }), false);
  assert.equal(bookmarkMatchesScope(sectioned, scope, {
    tagDescendants: identity,
  }), true);
  assert.equal(bookmarkMatchesScope(childSectioned, scope, {
    tagDescendants: identity,
  }), true);
});

test("genreMood and taxonomyTerm scopes cascade through taxonomyTermDescendants", () => {
  const bookmark = makeScopeBookmark({
    genreMoods: [{
      id: "gm-child",
    }] as ScopeMatchableBookmark["genreMoods"],
    taxonomyTerms: [{
      id: "tt-child",
    }] as ScopeMatchableBookmark["taxonomyTerms"],
  });
  const resolvers = {
    taxonomyTermDescendants: (id: string) =>
      new Set([id, id.replace("root", "child")]),
  };
  assert.equal(bookmarkMatchesScope(bookmark, {
    kind: "genreMood",
    id: "gm-root",
  }, resolvers), true);
  assert.equal(bookmarkMatchesScope(bookmark, {
    kind: "taxonomyTerm",
    id: "tt-root",
  }, resolvers), true);
});

test("language scope matches any usage row, narrowed by the optional level", () => {
  const bookmark = makeScopeBookmark({
    languageUsages: [{
      language: {
        id: "lang-en",
      },
      level: {
        id: "lvl-dub",
      },
    }] as ScopeMatchableBookmark["languageUsages"],
  });
  assert.equal(bookmarkMatchesScope(bookmark, {
    kind: "language",
    languageId: "lang-en",
  }), true);
  assert.equal(bookmarkMatchesScope(bookmark, {
    kind: "language",
    languageId: "lang-en",
    usageLevelId: "lvl-dub",
  }), true);
  assert.equal(bookmarkMatchesScope(bookmark, {
    kind: "language",
    languageId: "lang-en",
    usageLevelId: "lvl-subs",
  }), false);
});

test("validateBookmarkSearchScope narrows valid shapes and rejects malformed ones", () => {
  assert.deepEqual(validateBookmarkSearchScope({
    kind: "category",
    id: "cat-1",
  }), {
    kind: "category",
    id: "cat-1",
  });
  assert.deepEqual(validateBookmarkSearchScope({
    kind: "tag",
    id: "t-1",
    taggedSections: true,
  }), {
    kind: "tag",
    id: "t-1",
    taggedSections: true,
  });
  assert.deepEqual(validateBookmarkSearchScope({
    kind: "language",
    languageId: "lang-1",
    usageLevelId: "lvl-1",
  }), {
    kind: "language",
    languageId: "lang-1",
    usageLevelId: "lvl-1",
  });
  assert.equal(validateBookmarkSearchScope(undefined), undefined);
  assert.equal(validateBookmarkSearchScope(null), undefined);
  assert.equal(validateBookmarkSearchScope({
    kind: "category",
  }), undefined);
  assert.equal(validateBookmarkSearchScope({
    kind: "nonsense",
    id: "x",
  }), undefined);
  assert.equal(validateBookmarkSearchScope({
    kind: "language",
    languageId: "",
  }), undefined);
});
