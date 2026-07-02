import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PublishersListing } from "./PublisherManager";
import { useUiStore } from "../stores/uiStore";
import { makePublisher } from "../test-utils/factories";
import { renderWithRouter } from "../test-utils/router";

const bulkDeleteMutate = vi.fn();

const publisher = makePublisher({
  id: "55555555-5555-5555-5555-555555555555",
  name: "O'Reilly Media",
  slug: "oreilly-media",
  bookmarkCount: 3,
});

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

  it("renders the publisher with no per-row select control or bulk bar until selection mode is on", async () => {
    await renderWithRouter(<PublishersListing />, {
      paths,
    });
    expect(screen.getByText("O'Reilly Media")).toBeInTheDocument();
    // Selection mode is off (the toggle now lives in the header) -> no per-row select control, no Delete.
    expect(screen.queryByRole("button", {
      name: "Select O'Reilly Media",
    })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", {
      name: "Delete",
    })).not.toBeInTheDocument();
  });

  it("reveals the bulk delete action once a row is selected in selection mode", async () => {
    // The Select toggle lives in the header; drive selection mode through the store directly.
    useUiStore.setState({
      selectionMode: {
        "publishers-listing": true,
      },
    });
    await renderWithRouter(<PublishersListing />, {
      paths,
    });

    fireEvent.click(screen.getByRole("button", {
      name: "Select O'Reilly Media",
    }));

    expect(screen.getByRole("button", {
      name: "Delete",
    })).toBeInTheDocument();
  });
});
