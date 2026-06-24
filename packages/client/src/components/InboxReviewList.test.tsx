import type { InboxItem } from "@eesimple/types";

import { useState } from "react";

import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { InboxBulkActions, InboxReviewList } from "./InboxReviewList";
import { useInboxReviewController } from "./useInboxReviewController";
import { renderWithRouter } from "../test-utils/router";

import { useUiStore } from "@/stores/uiStore";

/**
 * Thin wrapper that mirrors the page-level layout: controller owned here, both
 * InboxBulkActions and InboxReviewList rendered so tests can reach bulk-action controls.
 */
function ReviewListWrapper({
  items, isFetching,
}: { items: InboxItem[];
  isFetching: boolean; }) {
  const controller = useInboxReviewController(items, isFetching);
  return (
    <>
      <InboxBulkActions {...controller} />
      <InboxReviewList controller={controller} />
    </>
  );
}

afterEach(() => {
  // The Cards/Table toggle persists per page key in the shared store; reset so tests don't leak.
  useUiStore.setState({
    viewMode: {},
  });
});

const LONG_TITLE
  = "This is a very long imported article title that should wrap fully instead of being cut off on mobile screens";

function makeItem(overrides: Partial<InboxItem> = {}): InboxItem {
  return {
    id: "item-1",
    importId: "import-1",
    url: "https://example.com/articles/the-post",
    rawUrl: "https://tracker.example/abc",
    title: LONG_TITLE,
    description: null,
    imageUrl: null,
    newsletterContext: null,
    anchorText: null,
    categoryId: null,
    status: "pending",
    markedForDeletion: false,
    duplicateBookmarkId: null,
    createdBookmarkId: null,
    errorReason: null,
    createdAt: "2026-06-22T00:00:00.000Z",
    importSource: "paste",
    sourceLabel: null,
    ...overrides,
  };
}

describe("InboxReviewList", () => {
  it("renders the full title without a truncation class so it wraps on mobile", async () => {
    await renderWithRouter(
      <ReviewListWrapper
        items={[makeItem()]}
        isFetching={false}
      />,
      {
        paths: ["/bookmarks/$bookmarkId"],
      },
    );
    const title = screen.getByText(LONG_TITLE);
    expect(title.className).not.toContain("truncate");
  });

  it("renders the full destination URL without a truncation class so it wraps", async () => {
    await renderWithRouter(
      <ReviewListWrapper
        items={[makeItem()]}
        isFetching={false}
      />,
      {
        paths: ["/bookmarks/$bookmarkId"],
      },
    );
    const url = screen.getByText("https://example.com/articles/the-post");
    expect(url.className).not.toContain("truncate");
  });

  it("rejects in one click — the Reject control is a direct button, not a dropdown", async () => {
    await renderWithRouter(
      <ReviewListWrapper
        items={[makeItem()]}
        isFetching={false}
      />,
      {
        paths: ["/bookmarks/$bookmarkId"],
      },
    );
    // A plain action button, so it isn't a dropdown trigger waiting on a second choice.
    expect(screen.getByLabelText("Reject")).not.toHaveAttribute("aria-haspopup", "menu");
  });

  it("offers block-by-URL/domain/path from the Block dropdown", async () => {
    await renderWithRouter(
      <ReviewListWrapper
        items={[makeItem()]}
        isFetching={false}
      />,
      {
        paths: ["/bookmarks/$bookmarkId"],
      },
    );
    // Radix DropdownMenu opens via keyboard under jsdom (see test-utils/setup.ts).
    fireEvent.keyDown(screen.getByRole("button", {
      name: "Block URL",
    }), {
      key: " ",
    });
    expect(await screen.findByText("Block this URL")).toBeInTheDocument();
    expect(screen.getByText("Block this domain")).toBeInTheDocument();
    expect(screen.getByText("Block this page path")).toBeInTheDocument();
  });

  it("reveals the captured passage in a Context expander", async () => {
    await renderWithRouter(
      <ReviewListWrapper
        items={[makeItem({
          newsletterContext: "Weekly Roundup\n\nThe surrounding paragraph that mentions the link.",
        })]}
        isFetching={false}
      />,
      {
        paths: ["/bookmarks/$bookmarkId"],
      },
    );
    fireEvent.click(screen.getByRole("button", {
      name: /Context/,
    }));
    expect(await screen.findByText(/The surrounding paragraph that mentions the link\./))
      .toBeInTheDocument();
  });

  it("offers an Unreject control on a rejected item to restore it to pending", async () => {
    await renderWithRouter(
      <ReviewListWrapper
        items={[makeItem({
          status: "rejected",
        })]}
        isFetching={false}
      />,
      {
        paths: ["/bookmarks/$bookmarkId"],
      },
    );
    expect(screen.getByLabelText("Restore to pending")).toBeInTheDocument();
    // The pending-only controls are gone once rejected.
    expect(screen.queryByLabelText("Approve – save as bookmark")).not.toBeInTheDocument();
  });

  it("shows a View bookmark link for an approved item", async () => {
    await renderWithRouter(
      <ReviewListWrapper
        items={[makeItem({
          status: "approved",
          createdBookmarkId: "bookmark-9",
          markedForDeletion: true,
        })]}
        isFetching={false}
      />,
      {
        paths: ["/bookmarks/$bookmarkId"],
      },
    );
    expect(screen.getByLabelText("View bookmark")).toBeInTheDocument();
  });

  it("enables the Delete all rejected menu item only when a rejected item is present", async () => {
    await renderWithRouter(
      <ReviewListWrapper
        items={[makeItem({
          status: "rejected",
        })]}
        isFetching={false}
      />,
      {
        paths: ["/bookmarks/$bookmarkId"],
      },
    );
    fireEvent.keyDown(screen.getByRole("button", {
      name: /Bulk Actions/,
    }), {
      key: " ",
    });
    const item = await screen.findByRole("menuitem", {
      name: /Delete all rejected \(1\)/,
    });
    expect(item).not.toHaveAttribute("data-disabled");
  });

  it("disables the Delete all rejected menu item when nothing is rejected", async () => {
    await renderWithRouter(
      <ReviewListWrapper
        items={[makeItem()]}
        isFetching={false}
      />,
      {
        paths: ["/bookmarks/$bookmarkId"],
      },
    );
    fireEvent.keyDown(screen.getByRole("button", {
      name: /Bulk Actions/,
    }), {
      key: " ",
    });
    const item = await screen.findByRole("menuitem", {
      name: /Delete all rejected \(0\)/,
    });
    expect(item).toHaveAttribute("data-disabled");
  });

  it("shows the add date on each item listing", async () => {
    await renderWithRouter(
      <ReviewListWrapper
        items={[makeItem()]}
        isFetching={false}
      />,
      {
        paths: ["/bookmarks/$bookmarkId"],
      },
    );
    // Date formatting is locale/timezone-dependent, so assert on the stable "Added " prefix.
    expect(screen.getByText(/^Added /)).toBeInTheDocument();
  });

  it("renders a sortable table with an Added column when the Table view is selected", async () => {
    useUiStore.setState({
      viewMode: {
        inbox: "table",
      },
    });
    await renderWithRouter(
      <ReviewListWrapper
        items={[makeItem()]}
        isFetching={false}
      />,
      {
        paths: ["/bookmarks/$bookmarkId"],
      },
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", {
      name: /Added/,
    })).toBeInTheDocument();
    // The item's title still renders, now as a table cell.
    expect(screen.getByText(LONG_TITLE)).toBeInTheDocument();
  });

  it("splits items into Pending and Processed sections with accurate counts", async () => {
    await renderWithRouter(
      <ReviewListWrapper
        items={[
          makeItem({
            id: "p1",
            title: "Pending one",
          }),
          makeItem({
            id: "a1",
            title: "Approved one",
            status: "approved",
            createdBookmarkId: "bk-1",
          }),
        ]}
        isFetching={false}
      />,
      {
        paths: ["/bookmarks/$bookmarkId"],
      },
    );
    expect(screen.getByRole("heading", {
      name: "Pending (1)",
    })).toBeInTheDocument();
    expect(screen.getByRole("heading", {
      name: "Processed (1)",
    })).toBeInTheDocument();
    expect(screen.getByText("Pending one")).toBeInTheDocument();
    expect(screen.getByText("Approved one")).toBeInTheDocument();
  });

  it("keeps a processed item in Pending until Sort now is clicked (no immediate move)", async () => {
    // A harness whose own state mimics a refetch: "Process it" flips the same item to approved, the
    // way the inbox query would after an approve mutation. The frozen split must keep it in Pending.
    function FreezeHarness() {
      const [items, setItems] = useState<InboxItem[]>([makeItem({
        id: "x1",
        title: "Freeze me",
      })]);
      const controller = useInboxReviewController(items, false);
      return (
        <>
          <button
            type="button"
            onClick={() => setItems([makeItem({
              id: "x1",
              title: "Freeze me",
              status: "approved",
              createdBookmarkId: "bk-9",
            })])}
          >
            Process it
          </button>
          <button
            type="button"
            onClick={controller.resortNow}
          >Sort now
          </button>
          <InboxReviewList controller={controller} />
        </>
      );
    }

    await renderWithRouter(<FreezeHarness />, {
      paths: ["/bookmarks/$bookmarkId"],
    });
    expect(screen.getByRole("heading", {
      name: "Pending (1)",
    })).toBeInTheDocument();

    // The item comes back from the "refetch" now approved — it must NOT jump sections.
    fireEvent.click(screen.getByRole("button", {
      name: "Process it",
    }));
    expect(screen.getByRole("heading", {
      name: "Pending (1)",
    })).toBeInTheDocument();
    expect(screen.getByRole("heading", {
      name: "Processed (0)",
    })).toBeInTheDocument();
    // Its status badge reflects the new state even while it stays in Pending.
    expect(screen.getByText("Added")).toBeInTheDocument();

    // Sort now re-partitions: the approved item moves to Processed.
    fireEvent.click(screen.getByRole("button", {
      name: "Sort now",
    }));
    expect(screen.getByRole("heading", {
      name: "Pending (0)",
    })).toBeInTheDocument();
    expect(screen.getByRole("heading", {
      name: "Processed (1)",
    })).toBeInTheDocument();
  });

  it("flags an approved item as marked for deletion", async () => {
    await renderWithRouter(
      <ReviewListWrapper
        items={[makeItem({
          status: "approved",
          createdBookmarkId: "bookmark-9",
          markedForDeletion: true,
        })]}
        isFetching={false}
      />,
      {
        paths: ["/bookmarks/$bookmarkId"],
      },
    );
    expect(screen.getByText("Will be deleted")).toBeInTheDocument();
  });
});
