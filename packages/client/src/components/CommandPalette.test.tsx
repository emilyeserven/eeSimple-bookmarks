import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CommandPalette } from "./CommandPalette";
import { renderWithRouter } from "../test-utils/router";

async function openPalette() {
  await renderWithRouter(<CommandPalette />);
  fireEvent.keyDown(document, {
    key: "k",
    metaKey: true,
  });
}

describe("CommandPalette", () => {
  it("renders nothing until opened via the keyboard shortcut", async () => {
    await renderWithRouter(<CommandPalette />);
    expect(screen.queryByPlaceholderText("Search pages and bookmarks…")).toBeNull();
  });

  it("opens on ⌘K with the default nav groups and quick actions", async () => {
    await openPalette();

    expect(await screen.findByPlaceholderText("Search pages and bookmarks…")).toBeInTheDocument();
    // The always-available tail groups render in the default view.
    expect(screen.getByText("Actions")).toBeInTheDocument();
    expect(screen.getByText("Pages")).toBeInTheDocument();
    expect(screen.getByText("Taxonomies")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    // The Actions group offers Add Bookmark plus the New-entity quick creates.
    expect(screen.getByText("Add Bookmark")).toBeInTheDocument();
    expect(screen.getByText("New Category")).toBeInTheDocument();
    expect(screen.getByText("New Custom Property")).toBeInTheDocument();
  });

  it("offers Quick Add when the query looks like a URL", async () => {
    await openPalette();

    const input = await screen.findByPlaceholderText("Search pages and bookmarks…");
    fireEvent.change(input, {
      target: {
        value: "https://example.com/article",
      },
    });

    expect(await screen.findByText("Quick Add")).toBeInTheDocument();
    expect(screen.getByText("https://example.com/article")).toBeInTheDocument();
  });

  it("closes on Escape and clears back to the default view on reopen", async () => {
    await openPalette();
    const input = await screen.findByPlaceholderText("Search pages and bookmarks…");
    fireEvent.change(input, {
      target: {
        value: "https://example.com",
      },
    });

    fireEvent.keyDown(input, {
      key: "Escape",
    });
    expect(screen.queryByPlaceholderText("Search pages and bookmarks…")).toBeNull();

    fireEvent.keyDown(document, {
      key: "k",
      metaKey: true,
    });
    const reopened = await screen.findByPlaceholderText("Search pages and bookmarks…");
    // The previous query was cleared on close.
    expect(reopened).toHaveValue("");
  });
});
