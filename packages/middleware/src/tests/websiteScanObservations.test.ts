import assert from "node:assert/strict";
import { test } from "node:test";
import type { WebsiteScanObservation } from "@eesimple/types";
import { deriveScanObservations, mergeScanObservations } from "@eesimple/types";

// Pure-helper tests for the website scanner-observations log — no DB / network.

test("deriveScanObservations maps a redirect error to redirect-failure with the error detail", () => {
  assert.deepEqual(
    deriveScanObservations({
      redirectError: "Too many redirects",
    }),
    [{
      kind: "redirect-failure",
      detail: "Too many redirects",
    }],
  );
});

test("deriveScanObservations maps a blocking HTTP status to blocks-crawlers, other statuses ignored", () => {
  for (const status of [401, 403, 429]) {
    assert.deepEqual(
      deriveScanObservations({
        headFetchStatus: status,
      }),
      [{
        kind: "blocks-crawlers",
        detail: `HTTP ${status}`,
      }],
    );
  }
  // A 404/500 is not a "blocks crawlers" signal.
  assert.deepEqual(deriveScanObservations({
    headFetchStatus: 404,
  }), []);
  assert.deepEqual(deriveScanObservations({
    headFetchStatus: 500,
  }), []);
});

test("deriveScanObservations maps timeout/network failures to unreachable, and hosted fallback to needs-hosted-metadata", () => {
  assert.deepEqual(
    deriveScanObservations({
      headFetchFailure: "timeout",
    }),
    [{
      kind: "unreachable",
      detail: "Timed out",
    }],
  );
  assert.deepEqual(
    deriveScanObservations({
      headFetchFailure: "network_error",
    }),
    [{
      kind: "unreachable",
      detail: "Network error",
    }],
  );
  assert.deepEqual(
    deriveScanObservations({
      usedHostedFallback: true,
    }),
    [{
      kind: "needs-hosted-metadata",
    }],
  );
});

test("deriveScanObservations returns nothing for a clean scan and combines multiple signals", () => {
  assert.deepEqual(deriveScanObservations({}), []);
  assert.deepEqual(deriveScanObservations({
    redirectError: null,
    usedHostedFallback: false,
  }), []);
  const combined = deriveScanObservations({
    redirectError: "err",
    headFetchStatus: 403,
    usedHostedFallback: true,
  });
  assert.deepEqual(combined.map(o => o.kind), ["redirect-failure", "blocks-crawlers", "needs-hosted-metadata"]);
});

const NOW = "2026-07-10T00:00:00.000Z";

test("mergeScanObservations adds a new scanner observation, stamping source + updatedAt", () => {
  const merged = mergeScanObservations([], [{
    kind: "blocks-crawlers",
    detail: "HTTP 403",
  }], NOW);
  assert.deepEqual(merged, [
    {
      kind: "blocks-crawlers",
      source: "scanner",
      updatedAt: NOW,
      detail: "HTTP 403",
    },
  ]);
});

test("mergeScanObservations preserves manual entries of other kinds and refreshes a re-detected kind", () => {
  const existing: WebsiteScanObservation[] = [
    {
      kind: "unreachable",
      source: "manual",
      detail: "note",
    },
    {
      kind: "blocks-crawlers",
      source: "scanner",
      updatedAt: "2020-01-01T00:00:00.000Z",
      detail: "HTTP 403",
    },
  ];
  const merged = mergeScanObservations(existing, [{
    kind: "blocks-crawlers",
    detail: "HTTP 429",
  }], NOW);
  assert.deepEqual(merged, [
    // Manual entry untouched, kept in place.
    {
      kind: "unreachable",
      source: "manual",
      detail: "note",
    },
    // Re-detected scanner entry refreshed (detail + updatedAt).
    {
      kind: "blocks-crawlers",
      source: "scanner",
      updatedAt: NOW,
      detail: "HTTP 429",
    },
  ]);
});

test("mergeScanObservations returns null when nothing changed (no-op write)", () => {
  const existing: WebsiteScanObservation[] = [
    {
      kind: "blocks-crawlers",
      source: "scanner",
      updatedAt: NOW,
      detail: "HTTP 403",
    },
  ];
  // Same kind + same detail, already source scanner → the only diff would be updatedAt, which we
  // don't treat as a change on its own.
  assert.equal(mergeScanObservations(existing, [{
    kind: "blocks-crawlers",
    detail: "HTTP 403",
  }], NOW), null);
  // Empty detection is always a no-op.
  assert.equal(mergeScanObservations(existing, [], NOW), null);
});

test("mergeScanObservations upgrades a manual entry to scanner when the scanner re-detects it", () => {
  const existing: WebsiteScanObservation[] = [
    {
      kind: "blocks-crawlers",
      source: "manual",
    },
  ];
  const merged = mergeScanObservations(existing, [{
    kind: "blocks-crawlers",
    detail: "HTTP 403",
  }], NOW);
  assert.deepEqual(merged, [
    {
      kind: "blocks-crawlers",
      source: "scanner",
      updatedAt: NOW,
      detail: "HTTP 403",
    },
  ]);
});
