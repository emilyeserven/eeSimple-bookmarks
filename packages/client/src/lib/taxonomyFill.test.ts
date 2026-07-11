// @vitest-environment node
// Side-effect import: the classic extension script assigns `globalThis.eesimpleTaxonomyFill`.
// Pure fetch/string logic — no DOM — so it opts into the faster node environment.
import "../../public/extension/taxonomyFill.js";

import { afterEach, describe, expect, it, vi } from "vitest";

interface ResolveResult {
  id: string | null;
  created: boolean;
}
interface TaxonomyOption {
  id: string;
  name: string;
}
interface RelationSpec {
  key: string;
  resolveKind: string;
  matchOnly: boolean;
  optionKey: string;
}
interface LanguageOption {
  id: string;
  name: string;
  isoCode: string | null;
}
interface TaxonomyFill {
  TAX_PATCH_KEY: Record<string, string>;
  resolveTaxonomyId: (
    serverUrl: string,
    kind: string,
    name: string,
    optionList: TaxonomyOption[],
  ) => Promise<ResolveResult>;
  resolveRelationId: (
    serverUrl: string,
    relSpec: RelationSpec,
    name: string,
    optionList: TaxonomyOption[],
  ) => Promise<ResolveResult>;
  normalizeLanguageCode: (raw: string | null) => string | null;
  resolveLanguageId: (
    serverUrl: string,
    rawCode: string,
    languages: LanguageOption[],
  ) => Promise<ResolveResult>;
  summarizeCreated: (entries: { kind: string;
    name: string; }[]) => string;
  summarizeFailed: (entries: { kind: string;
    name: string; }[]) => string;
}

const tax = (globalThis as unknown as { eesimpleTaxonomyFill: TaxonomyFill }).eesimpleTaxonomyFill;

/** A minimal `fetch` Response stand-in carrying only what resolveTaxonomyId reads. */
function jsonResponse(ok: boolean, body: unknown, status = ok ? 200 : 400): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

const SERVER = "http://server";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("resolveTaxonomyId", () => {
  it("matches an existing option case-insensitively without any fetch", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const options: TaxonomyOption[] = [{
      id: "p-1",
      name: "Ada Lovelace",
    }];

    const result = await tax.resolveTaxonomyId(SERVER, "people", "ada lovelace", options);

    expect(result).toEqual({
      id: "p-1",
      created: false,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("creates a name-only stub when there's no match, reporting created: true", async () => {
    const fetchSpy = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual({
        name: "Jane Doe",
      });
      return jsonResponse(true, {
        id: "p-new",
        name: "Jane Doe",
      }, 201);
    });
    vi.stubGlobal("fetch", fetchSpy);
    const options: TaxonomyOption[] = [];

    const result = await tax.resolveTaxonomyId(SERVER, "people", "Jane Doe", options);

    expect(result).toEqual({
      id: "p-new",
      created: true,
    });
    expect(fetchSpy).toHaveBeenCalledWith(`${SERVER}/api/people`, expect.objectContaining({
      method: "POST",
    }));
    // The new option is cached so a repeat name in the same apply run matches without another POST.
    expect(options).toContainEqual({
      id: "p-new",
      name: "Jane Doe",
    });
  });

  it("re-fetches and re-matches on a duplicate-create race (POST !ok), created: false", async () => {
    const fetchSpy = vi.fn()
      // POST create loses the race → conflict.
      .mockResolvedValueOnce(jsonResponse(false, {}, 409))
      // GET list re-match finds the winner (different case in the stored row).
      .mockResolvedValueOnce(jsonResponse(true, [{
        id: "g-1",
        name: "The Beatles",
      }]));
    vi.stubGlobal("fetch", fetchSpy);
    const options: TaxonomyOption[] = [];

    const result = await tax.resolveTaxonomyId(SERVER, "groups", "the beatles", options);

    expect(result).toEqual({
      id: "g-1",
      created: false,
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("returns id: null when it can neither create nor re-match (surfaced, not silently dropped)", async () => {
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce(jsonResponse(false, {}, 500))
      .mockResolvedValueOnce(jsonResponse(true, [{
        id: "other",
        name: "Someone Else",
      }]));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await tax.resolveTaxonomyId(SERVER, "people", "Missing Person", []);

    expect(result).toEqual({
      id: null,
      created: false,
    });
  });

  it("survives a thrown (network) POST by falling back to the list re-match", async () => {
    const fetchSpy = vi.fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(jsonResponse(true, [{
        id: "p-2",
        name: "Grace Hopper",
      }]));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await tax.resolveTaxonomyId(SERVER, "people", "grace hopper", []);

    expect(result).toEqual({
      id: "p-2",
      created: false,
    });
  });
});

const GROUPS_RELATION: RelationSpec = {
  key: "groups",
  resolveKind: "groups",
  matchOnly: false,
  optionKey: "groups",
};
const WEBSITES_RELATION: RelationSpec = {
  key: "websites",
  resolveKind: "websites",
  matchOnly: true,
  optionKey: "websites",
};

describe("resolveRelationId", () => {
  it("matches an existing related option case-insensitively without any fetch", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const options: TaxonomyOption[] = [{
      id: "g-1",
      name: "The Beatles",
    }];

    const result = await tax.resolveRelationId(SERVER, GROUPS_RELATION, "the beatles", options);

    expect(result).toEqual({
      id: "g-1",
      created: false,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("creates a stub for a creatable relation (groups) on a miss", async () => {
    const fetchSpy = vi.fn(async () => jsonResponse(true, {
      id: "g-new",
      name: "New Band",
    }, 201));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await tax.resolveRelationId(SERVER, GROUPS_RELATION, "New Band", []);

    expect(result).toEqual({
      id: "g-new",
      created: true,
    });
    expect(fetchSpy).toHaveBeenCalledWith(`${SERVER}/api/groups`, expect.objectContaining({
      method: "POST",
    }));
  });

  it("never POSTs for a match-only relation (websites) and returns id: null on a miss", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await tax.resolveRelationId(SERVER, WEBSITES_RELATION, "example.com", []);

    expect(result).toEqual({
      id: null,
      created: false,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("matches a match-only relation against an existing option (no fetch)", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const options: TaxonomyOption[] = [{
      id: "w-1",
      name: "Example",
    }];

    const result = await tax.resolveRelationId(SERVER, WEBSITES_RELATION, "example", options);

    expect(result).toEqual({
      id: "w-1",
      created: false,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("normalizeLanguageCode", () => {
  it("reduces a BCP-47 tag to its ISO-639-1 primary subtag", () => {
    expect(tax.normalizeLanguageCode("en-US")).toBe("en");
    expect(tax.normalizeLanguageCode("en_GB")).toBe("en");
    expect(tax.normalizeLanguageCode("ja")).toBe("ja");
  });

  it("maps common 3-letter codes to 2-letter", () => {
    expect(tax.normalizeLanguageCode("eng")).toBe("en");
    expect(tax.normalizeLanguageCode("jpn")).toBe("ja");
    expect(tax.normalizeLanguageCode("fre")).toBe("fr");
  });

  it("passes an unknown primary subtag through, and rejects blanks/too-short", () => {
    expect(tax.normalizeLanguageCode("xyz")).toBe("xyz");
    expect(tax.normalizeLanguageCode("")).toBeNull();
    expect(tax.normalizeLanguageCode(null)).toBeNull();
    expect(tax.normalizeLanguageCode("e")).toBeNull();
  });
});

describe("resolveLanguageId", () => {
  it("matches an existing language by normalized isoCode without any fetch", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const languages: LanguageOption[] = [{
      id: "l-en",
      name: "English",
      isoCode: "en",
    }];

    const result = await tax.resolveLanguageId(SERVER, "en-US", languages);

    expect(result).toEqual({
      id: "l-en",
      created: false,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("creates a Language on a miss and caches it", async () => {
    const fetchSpy = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(JSON.parse(String(init?.body))).toEqual({
        name: "de",
        isoCode: "de",
      });
      return jsonResponse(true, {
        id: "l-de",
        name: "German",
      }, 201);
    });
    vi.stubGlobal("fetch", fetchSpy);
    const languages: LanguageOption[] = [];

    const result = await tax.resolveLanguageId(SERVER, "de-DE", languages);

    expect(result).toEqual({
      id: "l-de",
      created: true,
    });
    expect(languages).toContainEqual({
      id: "l-de",
      name: "German",
      isoCode: "de",
    });
  });

  it("returns id: null for an unparseable code (no fetch)", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const result = await tax.resolveLanguageId(SERVER, "", []);

    expect(result).toEqual({
      id: null,
      created: false,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("summarizeCreated / summarizeFailed", () => {
  it("groups created names by kind with singular/plural nouns", () => {
    const msg = tax.summarizeCreated([
      {
        kind: "people",
        name: "Jane Doe",
      },
      {
        kind: "people",
        name: "John Smith",
      },
      {
        kind: "groups",
        name: "The Beatles",
      },
    ]);
    expect(msg).toBe("Created 2 new people: Jane Doe, John Smith. Created 1 new group: The Beatles.");
  });

  it("summarizes failures per kind", () => {
    const msg = tax.summarizeFailed([{
      kind: "people",
      name: "Missing Person",
    }]);
    expect(msg).toBe("Couldn't create 1 person: Missing Person.");
  });

  it("summarizes failures for the relation kinds (websites / youtubeChannels)", () => {
    const msg = tax.summarizeFailed([
      {
        kind: "websites",
        name: "example.com",
      },
      {
        kind: "youtubeChannels",
        name: "Some Channel",
      },
    ]);
    expect(msg).toBe(
      "Couldn't create 1 website: example.com. Couldn't create 1 YouTube channel: Some Channel.",
    );
  });

  it("renders nothing for an empty list", () => {
    expect(tax.summarizeCreated([])).toBe("");
    expect(tax.summarizeFailed([])).toBe("");
  });
});
