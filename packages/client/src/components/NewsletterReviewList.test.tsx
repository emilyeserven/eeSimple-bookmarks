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
    newsletterContext: null,
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

  it("renders the full destination URL without a truncation class so it wraps", async () => {
    await renderWithRouter(
      <NewsletterReviewList
        importId="import-1"
        items={[makeItem()]}
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
      <NewsletterReviewList
        importId="import-1"
        items={[makeItem()]}
      />,
      {
        paths: ["/bookmarks/$bookmarkId"],
      },
    );
    // A plain action button, so it isn't a dropdown trigger waiting on a second choice.
    expect(screen.getByLabelText("Reject")).not.toHaveAttribute("aria-haspopup", "menu");
  });

  it("offers block-by-URL/domain/path only after an item is rejected", async () => {
    await renderWithRouter(
      <NewsletterReviewList
        importId="import-1"
        items={[makeItem({
          status: "rejected",
        })]}
      />,
      {
        paths: ["/bookmarks/$bookmarkId"],
      },
    );
    // Radix DropdownMenu opens via keyboard under jsdom (see test-utils/setup.ts).
    fireEvent.keyDown(screen.getByRole("button", {
      name: "Block",
    }), {
      key: " ",
    });
    expect(await screen.findByText("Block this URL")).toBeInTheDocument();
    expect(screen.getByText("Block this domain")).toBeInTheDocument();
    expect(screen.getByText("Block this page path")).toBeInTheDocument();
  });

  it("reveals the captured newsletter passage in a Newsletter Context expander", async () => {
    await renderWithRouter(
      <NewsletterReviewList
        importId="import-1"
        items={[makeItem({
          newsletterContext: "Weekly Roundup\n\nThe surrounding paragraph that mentions the link.",
        })]}
      />,
      {
        paths: ["/bookmarks/$bookmarkId"],
      },
    );
    fireEvent.click(screen.getByRole("button", {
      name: /Newsletter Context/,
    }));
    expect(await screen.findByText(/The surrounding paragraph that mentions the link\./))
      .toBeInTheDocument();
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
