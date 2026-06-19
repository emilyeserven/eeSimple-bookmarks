import type { Website } from "@eesimple/types";

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WebsitesListing } from "./WebsiteManager";
import { renderWithRouter } from "../test-utils/router";

const openItem = vi.fn();

vi.mock("./panel/usePanelControls", () => ({
  usePanelControls: () => ({
    openItem,
  }),
}));

const website: Website = {
  id: "33333333-3333-3333-3333-333333333333",
  domain: "github.com",
  siteName: "GitHub",
  slug: "github",
  builtIn: false,
  shortenedLinks: [],
  paramRules: [],
  createdAt: "2026-06-01T00:00:00.000Z",
  bookmarkCount: 2,
};

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
  useAutoWebsiteFavicon: () => ({
    mutate: vi.fn(),
    isPending: false,
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
  "/taxonomies/websites/$websiteSlug",
  "/taxonomies/websites/$websiteSlug/edit",
];

describe("WebsitesListing", () => {
  it("does not open the panel on a plain row click (the link navigates to the view page)", async () => {
    openItem.mockClear();
    await renderWithRouter(<WebsitesListing />, {
      paths,
    });
    screen.getByText("GitHub").click();
    expect(openItem).not.toHaveBeenCalled();
  });

  it("opens the panel in view mode when the website row is alt-clicked", async () => {
    openItem.mockClear();
    await renderWithRouter(<WebsitesListing />, {
      paths,
    });
    fireEvent.click(screen.getByText("GitHub"), {
      altKey: true,
    });
    expect(openItem).toHaveBeenCalledWith("website", website.id, "view");
  });

  it("opens the panel in edit mode when the row menu's Edit item is alt-clicked", async () => {
    openItem.mockClear();
    await renderWithRouter(<WebsitesListing />, {
      paths,
    });
    // Open the row's "More options" menu. Radix opens on keyboard (Space) in jsdom because
    // jsdom 26 doesn't implement PointerEvent, making fireEvent.pointerDown useless.
    fireEvent.keyDown(screen.getByRole("button", {
      name: "More options for GitHub",
    }), {
      key: " ",
    });
    const editItem = await waitFor(() =>
      screen.getByRole("menuitem", {
        name: "Edit",
      }));
    fireEvent.click(editItem, {
      altKey: true,
    });
    expect(openItem).toHaveBeenCalledWith("website", website.id, "edit");
  });
});
