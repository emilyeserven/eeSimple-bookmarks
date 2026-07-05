import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BookmarkImageGallery } from "./BookmarkImageGallery";

import { makeBookmark, makeBookmarkImage } from "@/test-utils/factories";
import { renderWithRouter } from "@/test-utils/router";

const bookmarks = [
  makeBookmark({
    id: "b1",
    title: "First",
    images: [makeBookmarkImage({
      id: "i1",
    })],
  }),
];

describe("BookmarkImageGallery", () => {
  it("defaults to masonry (multi-column) layout with no aspect picker", async () => {
    await renderWithRouter(
      <BookmarkImageGallery
        bookmarks={bookmarks}
        pageKey="test-gallery-masonry"
      />,
      {
        paths: ["/bookmarks/$bookmarkId"],
      },
    );
    expect(screen.getByRole("list").className).toContain("columns-2");
    expect(screen.queryByRole("combobox", {
      name: "Aspect",
    })).not.toBeInTheDocument();
  });

  it("switches to a uniform crop grid and reveals the aspect picker when Crop is chosen", async () => {
    await renderWithRouter(
      <BookmarkImageGallery
        bookmarks={bookmarks}
        pageKey="test-gallery-crop"
      />,
      {
        paths: ["/bookmarks/$bookmarkId"],
      },
    );
    fireEvent.click(screen.getByRole("radio", {
      name: "Crop",
    }));
    expect(screen.getByRole("list").className).toContain("grid-cols-2");
    expect(screen.getByRole("combobox", {
      name: "Aspect",
    })).toBeInTheDocument();
  });
});
