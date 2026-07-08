import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BookmarkSearchView } from "./BookmarkSearchView";
import { renderWithRouter } from "../test-utils/router";

/**
 * Regression guard for the `useSyncExternalStore` infinite loop ("Maximum update depth exceeded",
 * React error #185). A zustand selector that returns a fresh `{}`/`[]` every call — e.g.
 * `state.tableColumnWidths[pageKey] ?? {}` — makes React see a new snapshot each render and loop.
 * The page mounts `BookmarkListPane` (which reads `tableColumnWidths`) with no saved widths, the
 * exact condition that triggered the crash on a plain `/bookmarks` load.
 */
describe("BookmarkListPane store selectors", () => {
  const messages: string[] = [];
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    messages.length = 0;
    errorSpy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      messages.push(args.map(String).join(" "));
    });
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("does not trigger a getSnapshot/update-depth loop on a plain listing render", async () => {
    await renderWithRouter(
      <BookmarkSearchView
        header={<h1>Bookmarks</h1>}
        pageKey="bookmarks"
        tree={[]}
        properties={[]}
        categories={[]}
        mediaTypes={[]}
        youtubeChannels={[]}
        websites={[]}
        bookmarks={[]}
        search={{}}
        onSearchChange={() => {
          // no-op: this render-only test never changes the search
        }}
        isLoading={false}
        error={null}
        emptyMessage="No bookmarks yet."
        noMatchMessage="No bookmarks match these filters."
      />,
      {
        paths: ["/bookmarks/$bookmarkId"],
      },
    );

    const looped = messages.some(message =>
      message.includes("Maximum update depth exceeded")
      || message.includes("getSnapshot should be cached"));
    expect(looped).toBe(false);
  });
});
