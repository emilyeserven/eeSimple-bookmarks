// @vitest-environment node
import type { SyncQuerySlot } from "./syncSourceQuery";
import type { SyncFieldDiff, SyncSourceFetch } from "./syncSourceTypes";

import { describe, expect, it } from "vitest";

import { numRef, resolveSyncSourceFetch, strRef, syncSourceFetchesEqual } from "./syncSourceQuery";

function slot<T>(overrides: Partial<SyncQuerySlot<T>> = {}): SyncQuerySlot<T> {
  return {
    active: true,
    isPending: false,
    isError: false,
    data: undefined,
    ...overrides,
  };
}

describe("strRef", () => {
  it("reads a non-empty string ref", () => {
    expect(strRef({
      url: "https://example.com",
    }, "url")).toBe("https://example.com");
  });

  it("treats missing, blank, and non-string refs as null", () => {
    expect(strRef(undefined, "url")).toBeNull();
    expect(strRef({}, "url")).toBeNull();
    expect(strRef({
      url: "",
    }, "url")).toBeNull();
    expect(strRef({
      url: 42,
    }, "url")).toBeNull();
  });
});

describe("numRef", () => {
  it("reads a numeric ref", () => {
    expect(numRef({
      itunesId: 123,
    }, "itunesId")).toBe(123);
  });

  it("treats missing and non-number refs as null", () => {
    expect(numRef(undefined, "itunesId")).toBeNull();
    expect(numRef({}, "itunesId")).toBeNull();
    expect(numRef({
      itunesId: "123",
    }, "itunesId")).toBeNull();
  });
});

describe("resolveSyncSourceFetch", () => {
  it("reports loading while any active slot is pending", () => {
    const result = resolveSyncSourceFetch([
      slot({
        isPending: true,
      }),
      slot({
        data: "ready",
        buildGroups: () => [{
          source: "b",
          rows: [],
        }],
      }),
    ]);
    expect(result).toEqual({
      diff: null,
      isLoading: true,
      error: null,
    });
  });

  it("ignores a pending inactive slot", () => {
    const result = resolveSyncSourceFetch([
      slot({
        active: false,
        isPending: true,
      }),
    ]);
    expect(result).toEqual({
      diff: {
        groups: [],
      },
      isLoading: false,
      error: null,
    });
  });

  it("surfaces the first active errored slot with an errorMessage", () => {
    const result = resolveSyncSourceFetch([
      slot({
        isError: true,
        errorMessage: "Couldn't scan the URL.",
      }),
      slot({
        isError: true,
        errorMessage: "Couldn't reach the geocoder.",
      }),
    ]);
    expect(result).toEqual({
      diff: null,
      isLoading: false,
      error: "Couldn't scan the URL.",
    });
  });

  it("silently ignores an errored slot with no errorMessage", () => {
    const result = resolveSyncSourceFetch([
      slot({
        isError: true,
      }),
      slot({
        data: "ready",
        buildGroups: data => [{
          source: data,
          rows: [],
        }],
      }),
    ]);
    expect(result).toEqual({
      diff: {
        groups: [{
          source: "ready",
          rows: [],
        }],
      },
      isLoading: false,
      error: null,
    });
  });

  it("ignores an errored inactive slot", () => {
    const result = resolveSyncSourceFetch([
      slot({
        active: false,
        isError: true,
        errorMessage: "should not surface",
      }),
    ]);
    expect(result.error).toBeNull();
  });

  it("concatenates groups from every resolved slot in order", () => {
    const result = resolveSyncSourceFetch([
      slot({
        data: "first",
        buildGroups: data => [{
          source: data,
          rows: [],
        }],
      }),
      slot({
        data: "second",
        buildGroups: data => [{
          source: data,
          rows: [],
        }],
      }),
    ]);
    expect(result.diff?.groups.map(g => g.source)).toEqual(["first", "second"]);
  });

  it("contributes nothing for a slot whose data is undefined", () => {
    const result = resolveSyncSourceFetch([
      slot({
        data: undefined,
        buildGroups: () => [{
          source: "never",
          rows: [],
        }],
      }),
    ]);
    expect(result.diff?.groups).toEqual([]);
  });

  it("contributes nothing for a slot with data but no buildGroups", () => {
    const result = resolveSyncSourceFetch([
      slot({
        data: "ready",
      }),
    ]);
    expect(result.diff?.groups).toEqual([]);
  });

  it("supports a buildGroups that itself resolves to an empty result (e.g. no geocode candidate)", () => {
    const result = resolveSyncSourceFetch([
      slot({
        data: {
          results: [] as string[],
        },
        buildGroups: (data) => {
          const candidate = data.results[0];
          if (!candidate) return [];
          return [{
            source: candidate,
            rows: [],
          }];
        },
      }),
    ]);
    expect(result).toEqual({
      diff: {
        groups: [],
      },
      isLoading: false,
      error: null,
    });
  });
});

describe("syncSourceFetchesEqual", () => {
  function row(overrides: Partial<SyncFieldDiff> = {}): SyncFieldDiff {
    return {
      key: "title",
      label: "Title",
      current: "Old",
      next: "New",
      kind: "text",
      defaultChecked: false,
      ...overrides,
    };
  }

  function fetch(rows: SyncFieldDiff[]): SyncSourceFetch {
    return {
      diff: {
        groups: [{
          source: "Page metadata",
          rows,
        }],
      },
      isLoading: false,
      error: null,
    };
  }

  it("treats two separately-built results with the same values as equal", () => {
    // The point of the helper: `resolveSyncSourceFetch` rebuilds its whole result on every call, so
    // identity says nothing — only the values do.
    expect(syncSourceFetchesEqual(fetch([row()]), fetch([row()]))).toBe(true);
  });

  it("ignores a row's opaque payload, which every provider derives from the compared fields", () => {
    expect(syncSourceFetchesEqual(
      fetch([row({
        payload: {
          kind: "field",
          value: "New",
        },
      })]),
      fetch([row({
        payload: {
          kind: "field",
          value: "New",
        },
      })]),
    )).toBe(true);
  });

  it("separates loading, error, and resolved results", () => {
    const loading: SyncSourceFetch = {
      diff: null,
      isLoading: true,
      error: null,
    };
    const errored: SyncSourceFetch = {
      diff: null,
      isLoading: false,
      error: "Couldn't scan the URL.",
    };
    expect(syncSourceFetchesEqual(loading, errored)).toBe(false);
    expect(syncSourceFetchesEqual(loading, fetch([row()]))).toBe(false);
    expect(syncSourceFetchesEqual(loading, {
      diff: null,
      isLoading: true,
      error: null,
    })).toBe(true);
  });

  it("detects a changed row value, a changed default, and a changed row count", () => {
    expect(syncSourceFetchesEqual(fetch([row()]), fetch([row({
      next: "Newer",
    })]))).toBe(false);
    expect(syncSourceFetchesEqual(fetch([row()]), fetch([row({
      defaultChecked: true,
    })]))).toBe(false);
    expect(syncSourceFetchesEqual(fetch([row()]), fetch([row(), row({
      key: "description",
    })]))).toBe(false);
  });

  it("detects a renamed or added group", () => {
    const renamed: SyncSourceFetch = {
      diff: {
        groups: [{
          source: "Kavita",
          rows: [row()],
        }],
      },
      isLoading: false,
      error: null,
    };
    expect(syncSourceFetchesEqual(fetch([row()]), renamed)).toBe(false);
    expect(syncSourceFetchesEqual(fetch([row()]), {
      diff: {
        groups: [],
      },
      isLoading: false,
      error: null,
    })).toBe(false);
  });
});
