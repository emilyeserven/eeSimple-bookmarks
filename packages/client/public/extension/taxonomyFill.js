/*
 * eeSimple Bookmarks — extension taxonomy resolve/summarize helpers.
 *
 * A classic browser script (no import/export, no chrome APIs) that assigns
 * `globalThis.eesimpleTaxonomyFill`. Loaded by popup.html *before* popup.js (it runs in the popup,
 * not injected into the page), and imported as a side-effect module by the vitest suite so the
 * match-or-create resolver and the pure created/failed summary helpers are unit-testable.
 *
 * `resolveTaxonomyId` is the load-bearing bit: it matches an extracted taxonomy name against the
 * fill-context option list (case-insensitive) or creates a name-only stub, and — unlike the old
 * boolean-ish "return id or null" — reports *why* via `{ id, created }` so the apply flow can note
 * created entities and surface genuine failures instead of dropping the name silently.
 */
(function () {
  // Which taxonomy kind maps to which PATCH id-array field / stub endpoint.
  const TAX_PATCH_KEY = {
    people: "personIds",
    groups: "groupIds",
    locations: "locationIds",
    tags: "tagIds",
  };

  // Mirror of TAXONOMY_ENTITY_SPECS (packages/types/src/extensionFillTaxonomy.ts): for a
  // `taxonomyEntity` / `taxonomyDirect` fill target, the PATCH base path + name key + display noun of
  // each associated taxonomy, plus `image: true` when the entity exposes a `${path}/image` multipart
  // avatar/poster endpoint (drives `taxonomyDirect` `field: "image"`), and its `relations` (id-array
  // relation targets) + `languageOwnerType` (the language_usages owner type for a `language` target).
  // The popup is a classic script and can't import the TS registry, so this is duplicated — keep
  // `path`/`nameKey`/`image`/`relations`/`languageOwnerType` in sync with that file (the
  // fillEngine.test.ts side-effect import asserts the image alignment).
  const RELATION_GROUPS = {
    key: "groups",
    label: "Groups",
    resolveKind: "groups",
    resolveNameKey: "name",
    patchKey: "groupIds",
    optionKey: "groups",
    matchOnly: false,
  };
  const RELATION_WEBSITES = {
    key: "websites",
    label: "Websites",
    resolveKind: "websites",
    resolveNameKey: "siteName",
    patchKey: "websiteIds",
    optionKey: "websites",
    matchOnly: true,
  };
  const RELATION_YOUTUBE_CHANNELS = {
    key: "youtubeChannels",
    label: "YouTube channels",
    resolveKind: "youtube-channels",
    resolveNameKey: "name",
    patchKey: "youtubeChannelIds",
    optionKey: "youtubeChannels",
    matchOnly: true,
  };
  const TAXONOMY_ENTITY_PATCH = {
    website: {
      path: "/api/websites",
      nameKey: "siteName",
      noun: "website",
      image: true,
      languageOwnerType: "website",
    },
    category: {
      path: "/api/categories",
      nameKey: "name",
      noun: "category",
    },
    mediaType: {
      path: "/api/media-types",
      nameKey: "name",
      noun: "media type",
    },
    youtubeChannel: {
      path: "/api/youtube-channels",
      nameKey: "name",
      noun: "YouTube channel",
      image: true,
      languageOwnerType: "youtubeChannel",
    },
    newsletter: {
      path: "/api/newsletters",
      nameKey: "name",
      noun: "newsletter",
    },
    group: {
      path: "/api/groups",
      nameKey: "name",
      noun: "group",
      image: true,
    },
    people: {
      path: "/api/people",
      nameKey: "name",
      noun: "person",
      image: true,
      relations: [RELATION_GROUPS, RELATION_WEBSITES, RELATION_YOUTUBE_CHANNELS],
      languageOwnerType: "person",
    },
    groups: {
      path: "/api/groups",
      nameKey: "name",
      noun: "group",
      image: true,
      relations: [RELATION_WEBSITES, RELATION_YOUTUBE_CHANNELS],
    },
    tags: {
      path: "/api/tags",
      nameKey: "name",
      noun: "tag",
    },
    locations: {
      path: "/api/locations",
      nameKey: "name",
      noun: "location",
    },
  };

  // Singular / plural nouns for the post-apply summary lines.
  const TAX_NOUN = {
    people: {
      one: "person",
      many: "people",
    },
    groups: {
      one: "group",
      many: "groups",
    },
    locations: {
      one: "location",
      many: "locations",
    },
    tags: {
      one: "tag",
      many: "tags",
    },
    // Relation `optionKey`s (used by relation `taxonomyEntity` targets) — for the created/failed summary.
    websites: {
      one: "website",
      many: "websites",
    },
    youtubeChannels: {
      one: "YouTube channel",
      many: "YouTube channels",
    },
  };

  // Resolve a taxonomy name to an id: match an existing option (case-insensitive), else create a
  // name-only stub. On a duplicate-create race (or any create failure), re-fetch the list and
  // re-match by name so the value still links. Returns `{ id, created }`: `id` is null only when the
  // name truly couldn't be matched or created (the caller surfaces that instead of silently dropping
  // it); `created` is true when this call minted a new stub.
  async function resolveTaxonomyId(serverUrl, kind, name, optionList) {
    const lower = name.toLowerCase();
    const hit = optionList.find(o => o.name.toLowerCase() === lower);
    if (hit) return {
      id: hit.id,
      created: false,
    };

    try {
      const res = await fetch(`${serverUrl}/api/${kind}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        if (created && created.id) {
          optionList.push({
            id: created.id,
            name,
          });
          return {
            id: created.id,
            created: true,
          };
        }
      }
    }
    catch {
      // fall through to the re-match below
    }

    try {
      const res = await fetch(`${serverUrl}/api/${kind}`);
      if (res.ok) {
        const all = await res.json();
        const match = Array.isArray(all)
          ? all.find(o => o && typeof o.name === "string" && o.name.toLowerCase() === lower)
          : null;
        if (match) {
          optionList.push({
            id: match.id,
            name: match.name,
          });
          return {
            id: match.id,
            created: false,
          };
        }
      }
    }
    catch {
      // give up
    }
    return {
      id: null,
      created: false,
    };
  }

  // Resolve an extracted name to a *related* taxonomy id for a `relation:<key>` target. Matches an
  // existing option case-insensitively; for a creatable relation (groups) it falls back to
  // `resolveTaxonomyId` (POST a name-only stub). A `matchOnly` relation (websites/youtube-channels —
  // their create routes need a domain/channelUrl) never POSTs and returns `{id:null}` on a miss so the
  // caller surfaces it instead of silently dropping it.
  async function resolveRelationId(serverUrl, relSpec, name, optionList) {
    const lower = name.toLowerCase();
    const hit = (optionList || []).find(o => o.name.toLowerCase() === lower);
    if (hit) return {
      id: hit.id,
      created: false,
    };
    if (relSpec.matchOnly) return {
      id: null,
      created: false,
    };
    return resolveTaxonomyId(serverUrl, relSpec.resolveKind, name, optionList);
  }

  // A minimal duplicate of the middleware's `normalizeLanguageCode` (utils/languageCodes.ts): reduce a
  // BCP-47 tag or 3-letter code to an ISO-639-1 primary subtag. Deliberately covers only the primary
  // subtag + a small table of common bibliographic 3→2 codes; the server's `isoCode` uniqueness on
  // match-or-create catches the long tail. Keep loosely in sync with that file.
  const ALT_CODE_TO_ISO1 = {
    eng: "en",
    jpn: "ja",
    kor: "ko",
    fra: "fr",
    fre: "fr",
    deu: "de",
    ger: "de",
    spa: "es",
    zho: "zh",
    chi: "zh",
    por: "pt",
    rus: "ru",
    ita: "it",
    nld: "nl",
    dut: "nl",
    ara: "ar",
  };
  function normalizeLanguageCode(raw) {
    if (!raw) return null;
    const primary = String(raw).trim().toLowerCase().replace(/_/g, "-").split("-")[0];
    if (!primary || primary.length < 2) return null;
    return ALT_CODE_TO_ISO1[primary] || primary;
  }

  // Resolve an extracted page-language code to a Language id: normalize, match by `isoCode`, else
  // create a Language (name falls back to the code). Returns `{ id, created }`; `id` is null when the
  // code can't be normalized or the create fails (the caller surfaces that).
  async function resolveLanguageId(serverUrl, rawCode, languages) {
    const code = normalizeLanguageCode(rawCode);
    if (!code) return {
      id: null,
      created: false,
    };
    const hit = (languages || []).find(l => l.isoCode === code);
    if (hit) return {
      id: hit.id,
      created: false,
    };
    try {
      const res = await fetch(`${serverUrl}/api/languages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: code,
          isoCode: code,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        if (created && created.id) {
          (languages || []).push({
            id: created.id,
            name: created.name || code,
            isoCode: code,
          });
          return {
            id: created.id,
            created: true,
          };
        }
      }
    }
    catch {
      // give up — surfaced as a failure by the caller
    }
    return {
      id: null,
      created: false,
    };
  }

  // Group `{ kind, name }` entries by kind (preserving first-seen order) and render each group with
  // `render(kind, names)`, joining the group strings with a space.
  function summarizeByKind(entries, render) {
    const byKind = {};
    const order = [];
    (entries || []).forEach((entry) => {
      if (!byKind[entry.kind]) {
        byKind[entry.kind] = [];
        order.push(entry.kind);
      }
      byKind[entry.kind].push(entry.name);
    });
    return order.map(kind => render(kind, byKind[kind])).join(" ");
  }

  // "Created 2 new people: X, Y." — the post-apply confirmation for freshly-minted stubs.
  function summarizeCreated(created) {
    return summarizeByKind(created, (kind, names) => {
      const noun = names.length === 1 ? TAX_NOUN[kind].one : TAX_NOUN[kind].many;
      return `Created ${names.length} new ${noun}: ${names.join(", ")}.`;
    });
  }

  // "Couldn't create 1 group: Z." — surfaced when a name failed to match or create.
  function summarizeFailed(failed) {
    return summarizeByKind(failed, (kind, names) => {
      const noun = names.length === 1 ? TAX_NOUN[kind].one : TAX_NOUN[kind].many;
      return `Couldn't create ${names.length} ${noun}: ${names.join(", ")}.`;
    });
  }

  globalThis.eesimpleTaxonomyFill = {
    TAX_PATCH_KEY,
    TAX_NOUN,
    TAXONOMY_ENTITY_PATCH,
    resolveTaxonomyId,
    resolveRelationId,
    normalizeLanguageCode,
    resolveLanguageId,
    summarizeCreated,
    summarizeFailed,
  };
})();
