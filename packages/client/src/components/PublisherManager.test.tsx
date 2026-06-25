import type { Publisher } from "@eesimple/types";

import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PublishersListing } from "./PublisherManager";
import { useUiStore } from "../stores/uiStore";
import { renderWithRouter } from "../test-utils/router";

const bulkDeleteMutate = vi.fn();

const publisher: Publisher = {
  id: "55555555-5555-5555-5555-555555555555",
  name: "O'Reilly Media",
  slug: "oreilly-media",
  websiteId: null,
  website: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  bookmarkCount: 3,
  socialLinks: [],
};

vi.mock("../hooks/usePublishers", () => ({
  usePublishers: () => ({
    data: [publisher],
    isLoading: false,
    error: null,
  }),
  useBulkDeletePublishers: () => ({
    mutate: bulkDeleteMutate,
    isPending: false,
  }),
}));

const paths = ["/bookmarks", "/taxonomies/publishers/$publisherSlug/general"];

describe("PublishersListing bulk delete", () => {
  beforeEach(() => {
    bulkDeleteMutate.mockClear();
    // Selection state is transient in-memory store state — reset it so cases don't leak.
    useUiStore.setState({
      selection: {},
      selectionMode: {},
    });
  });

  it("renders the publisher and a Select toggle, hiding the bulk bar until a row is selected", async () => {
    await renderWithRouter(<PublishersListing />, {
      paths,
    });
    expect(screen.getByText("O'Reilly Media")).toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: "Select",
    })).toBeInTheDocument();
    // No selection yet -> no per-row select control and no Delete action.
    expect(screen.queryByRole("button", {
      name: "Select O'Reilly Media",
    })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", {
      name: "Delete",
    })).not.toBeInTheDocument();
  });

  it("reveals the bulk delete action once a row is selected in selection mode", async () => {
    await renderWithRouter(<PublishersListing />, {
      paths,
    });

    fireEvent.click(screen.getByRole("button", {
      name: "Select",
    }));
    expect(screen.getByRole("button", {
      name: "Done selecting",
    })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", {
      name: "Select O'Reilly Media",
    }));

    expect(screen.getByRole("button", {
      name: "Delete",
    })).toBeInTheDocument();
  });
});
