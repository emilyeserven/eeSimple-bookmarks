import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WebsitesListing } from "./WebsiteManager";
import { makeWebsite } from "../test-utils/factories";
import { renderWithRouter } from "../test-utils/router";

const website = makeWebsite({
  id: "33333333-3333-3333-3333-333333333333",
  domain: "github.com",
  siteName: "GitHub",
  slug: "github",
  bookmarkCount: 2,
});

vi.mock("../hooks/useWebsites", () => ({
  useWebsites: () => ({
    data: [website],
    isLoading: false,
    error: null,
  }),
  useCreateWebsite: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useUpdateWebsite: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useBulkDeleteWebsites: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useAutoWebsiteFavicon: () => ({
    mutate: vi.fn(),
    isPending: false,
    cooldown: {
      isOnCooldown: false,
      remaining: 0,
      startCooldown: vi.fn(),
    },
  }),
}));

vi.mock("../hooks/useBookmarks", () => ({
  useBookmarksOnHost: () => ({
    data: [],
    isLoading: false,
  }),
  useBulkExpandBookmarkUrls: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

const paths = [
  "/bookmarks",
  "/taxonomies/websites/$websiteSlug",
  "/taxonomies/websites/$websiteSlug/info",
  "/taxonomies/websites/$websiteSlug/edit",
];

describe("WebsitesListing", () => {
  it("renders the website with links to its bookmarks, info, and edit pages", async () => {
    await renderWithRouter(<WebsitesListing />, {
      paths,
    });
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByRole("link", {
      name: "View GitHub",
    })).toHaveAttribute("href", "/taxonomies/websites/github/info");
    expect(screen.getByRole("link", {
      name: "Edit GitHub",
    })).toHaveAttribute("href", "/taxonomies/websites/github/edit");
  });
});
