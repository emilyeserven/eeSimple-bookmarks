import type { SyncProvider } from "@/lib/syncSources/syncSourceTypes";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SyncFromSourceModal } from "./SyncFromSourceModal";

/**
 * `AppSyncModal` renders this modal for as long as an edit form has a `SyncProvider` registered —
 * open or not — so its hook runs on every edit page. Its selection-seeding effect keys on the diff
 * the source hook returns, and `resolveSyncSourceFetch` rebuilds that object on every call; before
 * `useStableSyncSourceFetch` the pair looped forever (React "Maximum update depth exceeded", minified
 * error #185) the moment any entity's edit surface mounted. These render a modal whose queries never
 * resolve and assert the mount simply settles.
 */
function makeProvider(overrides: Partial<SyncProvider> = {}): SyncProvider {
  return {
    descriptorKind: "bookmark",
    entityLabel: "A bookmark",
    entityId: "bookmark-1",
    refs: {
      url: "https://example.com/thing",
      currentTitle: "A bookmark",
      currentDescription: null,
      currentImageUrl: null,
    },
    applyStaged: () => {
      // no-op: these tests only mount the modal, they never apply a row
    },
    ...overrides,
  };
}

function renderModal(provider: SyncProvider, open: boolean) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SyncFromSourceModal
        provider={provider}
        open={open}
        onOpenChange={() => {
          // no-op: nothing under test closes the modal
        }}
      />
    </QueryClientProvider>,
  );
}

describe("SyncFromSourceModal", () => {
  it("mounts closed without an unbounded re-render loop", () => {
    expect(() => renderModal(makeProvider(), false)).not.toThrow();
  });

  it("mounts open without an unbounded re-render loop", () => {
    expect(() => renderModal(makeProvider(), true)).not.toThrow();
  });

  it("mounts an image-taxonomy provider, whose source resolves rows with no query", () => {
    // The Plex slot builds its row from a ref-derived URL, so this provider's diff is non-empty on
    // the very first render — the case where an unstable diff identity bit hardest.
    expect(() => renderModal(makeProvider({
      descriptorKind: "image-taxonomy",
      refs: {
        kind: "plex",
        plexRatingKey: "1234",
        label: "Poster",
        currentImageUrl: null,
      },
    }), false)).not.toThrow();
  });
});
