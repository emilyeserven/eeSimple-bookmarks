import type { NewsletterImportItem } from "@eesimple/types";

import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NewsletterReviewList } from "./NewsletterReviewList";
import { renderWithRouter } from "../test-utils/router";

const LONG_TITLE
  = "This is a very long newsletter article title that should wrap fully instead of being cut off on mobile screens";

function makeItem(overrides: Partial<NewsletterImportItem> = {}): NewsletterImportItem {
  return {
    id: "item-1",
    importId: "import-1",
    url: "https://example.com/articles/the-post",
    rawUrl: "https://tracker.example/abc",
    title: LONG_TITLE,
    description: null,
    imageUrl: null,
    anchorText: null,
    categoryId: null,
    status: "pending",
    duplicateBookmarkId: null,
    createdBookmarkId: null,
    errorReason: null,
    createdAt: "2026-06-22T00:00:00.000Z",
    ...overrides,
  };
}

describe("NewsletterReviewList", () => {
  it("renders the full title without a truncation class so it wraps on mobile", async () => {
    await renderWithRouter(
      <NewsletterReviewList
        importId="import-1"
        items={[makeItem()]}
      />,
      {
        paths: ["/bookmarks/$bookmarkId"],
      },
    );
    const title = screen.getByText(LONG_TITLE);
    expect(title.className).not.toContain("truncate");
  });

  it("offers reject-and-block options for an item with a resolvable URL", async () => {
    await renderWithRouter(
      <NewsletterReviewList
        importId="import-1"
        items={[makeItem()]}
      />,
      {
        paths: ["/bookmarks/$bookmarkId"],
      },
    );
    // Radix DropdownMenu opens via keyboard under jsdom (see test-utils/setup.ts).
    fireEvent.keyDown(screen.getByLabelText("Reject"), {
      key: " ",
    });
    expect(await screen.findByText("Reject only")).toBeInTheDocument();
    expect(screen.getByText("Reject & block this domain")).toBeInTheDocument();
    expect(screen.getByText("Reject & block this page path")).toBeInTheDocument();
  });

  it("shows a View bookmark link for an approved item", async () => {
    await renderWithRouter(
      <NewsletterReviewList
        importId="import-1"
        items={[makeItem({
          status: "approved",
          createdBookmarkId: "bookmark-9",
        })]}
      />,
      {
        paths: ["/bookmarks/$bookmarkId"],
      },
    );
    expect(screen.getByLabelText("View bookmark")).toBeInTheDocument();
  });
});
