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
interface TaxonomyFill {
  TAX_PATCH_KEY: Record<string, string>;
  resolveTaxonomyId: (
    serverUrl: string,
    kind: string,
    name: string,
    optionList: TaxonomyOption[],
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

  it("renders nothing for an empty list", () => {
    expect(tax.summarizeCreated([])).toBe("");
    expect(tax.summarizeFailed([])).toBe("");
  });
});
