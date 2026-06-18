import type { Bookmark, CustomProperty } from "@eesimple/types";

import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BookmarkCard } from "./BookmarkCard";
import { renderWithRouter } from "../test-utils/router";

const DETAIL_PATH = "/bookmarks/$bookmarkId";

const bookmark: Bookmark = {
  id: "11111111-1111-1111-1111-111111111111",
  url: "https://github.com",
  originalUrl: null,
  title: "GitHub",
  description: "Where the code lives.",
  image: null,
  categoryId: "22222222-2222-2222-2222-222222222222",
  website: null,
  tags: [
    {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      name: "dev",
      parentId: null,
    },
    {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      name: "tools",
      parentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    },
  ],
  numberValues: [],
  booleanValues: [],
  priority: 0,
  createdAt: "2026-06-01T00:00:00.000Z",
};

const starsProperty: CustomProperty = {
  id: "prop-stars",
  name: "Stars",
  type: "number",
  description: null,
  numberMin: null,
  numberMax: null,
  unitSingular: "star",
  unitPlural: "stars",
  valuePrefix: null,
  zeroLabel: null,
  maxLabel: null,
  operandPropertyIds: [],
  categoryIds: [],
  showInForm: false,
  hiddenFromForm: false,
  showInListings: true,
  createdAt: "2026-06-01T00:00:00.000Z",
};

const reviewedProperty: CustomProperty = {
  id: "prop-reviewed",
  name: "Reviewed",
  type: "boolean",
  description: null,
  numberMin: null,
  numberMax: null,
  unitSingular: null,
  unitPlural: null,
  valuePrefix: null,
  zeroLabel: null,
  maxLabel: null,
  operandPropertyIds: [],
  categoryIds: [],
  showInForm: false,
  hiddenFromForm: false,
  showInListings: true,
  createdAt: "2026-06-01T00:00:00.000Z",
};

describe("BookmarkCard", () => {
  it("renders the bookmark title and description", async () => {
    await renderWithRouter(<BookmarkCard bookmark={bookmark} />, {
      paths: [DETAIL_PATH],
    });
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("Where the code lives.")).toBeInTheDocument();
  });

  it("links the title to the bookmark's detail page", async () => {
    await renderWithRouter(<BookmarkCard bookmark={bookmark} />, {
      paths: [DETAIL_PATH],
    });
    expect(screen.getByRole("link", {
      name: "GitHub",
    })).toHaveAttribute("href", `/bookmarks/${bookmark.id}`);
  });

  it("renders each assigned tag name", async () => {
    await renderWithRouter(<BookmarkCard bookmark={bookmark} />, {
      paths: [DETAIL_PATH],
    });
    expect(screen.getByText("dev")).toBeInTheDocument();
    expect(screen.getByText("tools")).toBeInTheDocument();
  });

  it("pluralizes a number value's unit and renders boolean values", async () => {
    await renderWithRouter(
      <BookmarkCard
        bookmark={{
          ...bookmark,
          numberValues: [
            {
              propertyId: "prop-stars",
              value: 1,
            },
          ],
          booleanValues: [
            {
              propertyId: "prop-reviewed",
              value: true,
            },
          ],
        }}
        properties={[starsProperty, reviewedProperty]}
      />,
      {
        paths: [DETAIL_PATH],
      },
    );
    expect(screen.getByText("Stars: 1 star")).toBeInTheDocument();
    expect(screen.getByText("Reviewed: Yes")).toBeInTheDocument();
  });

  it("uses the plural unit for a value other than one", async () => {
    await renderWithRouter(
      <BookmarkCard
        bookmark={{
          ...bookmark,
          numberValues: [
            {
              propertyId: "prop-stars",
              value: 3,
            },
          ],
        }}
        properties={[starsProperty]}
      />,
      {
        paths: [DETAIL_PATH],
      },
    );
    expect(screen.getByText("Stars: 3 stars")).toBeInTheDocument();
  });

  it("calls onDelete with the bookmark id when the delete button is clicked", async () => {
    const onDelete = vi.fn();
    await renderWithRouter(
      <BookmarkCard
        bookmark={bookmark}
        onDelete={onDelete}
      />,
      {
        paths: [DETAIL_PATH],
      },
    );
    // Radix DropdownMenuTrigger opens on keyboard (Enter/Space) in jsdom because
    // jsdom 26 doesn't implement PointerEvent, making fireEvent.pointerDown useless.
    fireEvent.keyDown(screen.getByRole("button", {
      name: "More options",
    }), {
      key: " ",
    });
    await waitFor(() =>
      screen.getByRole("menuitem", {
        name: "Delete",
      }));
    fireEvent.click(screen.getByRole("menuitem", {
      name: "Delete",
    }));
    expect(onDelete).toHaveBeenCalledWith(bookmark.id);
  });
});
