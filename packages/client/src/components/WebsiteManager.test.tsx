import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WebsitesListing } from "./WebsiteManager";
import { makeWebsite } from "../test-utils/factories";
import { renderWithRouter } from "../test-utils/router";

const openItem = vi.fn();

vi.mock("./panel/usePanelControls", () => ({
  usePanelControls: () => ({
    openItem,
  }),
}));

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
  it("does not open the panel on a plain row click (the link navigates to the listing page)", async () => {
    openItem.mockClear();
    await renderWithRouter(<WebsitesListing />, {
      paths,
    });
    screen.getByText("GitHub").click();
    expect(openItem).not.toHaveBeenCalled();
  });

  it("opens the panel in view mode when the website's Info button is alt-clicked", async () => {
    openItem.mockClear();
    await renderWithRouter(<WebsitesListing />, {
      paths,
    });
    fireEvent.click(screen.getByRole("link", {
      name: "View GitHub",
    }), {
      altKey: true,
    });
    expect(openItem).toHaveBeenCalledWith("website", website.id, "view");
  });

  it("opens the panel in edit mode when the website's Edit button is alt-clicked", async () => {
    openItem.mockClear();
    await renderWithRouter(<WebsitesListing />, {
      paths,
    });
    fireEvent.click(screen.getByRole("link", {
      name: "Edit GitHub",
    }), {
      altKey: true,
    });
    expect(openItem).toHaveBeenCalledWith("website", website.id, "edit");
  });
});
