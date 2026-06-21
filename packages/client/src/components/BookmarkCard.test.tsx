import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BookmarkCard } from "./BookmarkCard";
import { makeBookmark, makeCustomProperty } from "../test-utils/factories";
import { renderWithRouter } from "../test-utils/router";

// Stub the bookmark hooks so the card-menu editors can assert the update call without a live API.
const updateMutate = vi.fn<(args: unknown) => void>();
vi.mock("../hooks/useBookmarks", () => ({
  useAutoBookmarkImage: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useUpdateBookmark: () => ({
    mutate: updateMutate,
  }),
}));

const DETAIL_PATH = "/bookmarks/$bookmarkId";

/** Open the card's "More" menu (Radix opens on keyboard in jsdom, which lacks PointerEvent). */
function openMoreMenu() {
  fireEvent.keyDown(screen.getByRole("button", {
    name: "More options",
  }), {
    key: " ",
  });
}

const bookmark = makeBookmark({
  id: "11111111-1111-1111-1111-111111111111",
  url: "https://github.com",
  title: "GitHub",
  description: "Where the code lives.",
  categoryId: "22222222-2222-2222-2222-222222222222",
  tags: [
    {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      name: "dev",
      slug: "dev",
      parentId: null,
    },
    {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      name: "tools",
      slug: "tools",
      parentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    },
  ],
});

const starsProperty = makeCustomProperty({
  id: "prop-stars",
  name: "Stars",
  slug: "stars",
  type: "number",
  unitSingular: "star",
  unitPlural: "stars",
});

const reviewedProperty = makeCustomProperty({
  id: "prop-reviewed",
  name: "Reviewed",
  slug: "reviewed",
  type: "boolean",
});

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

  it("toggles a boolean property from the card menu and saves the merged values", async () => {
    updateMutate.mockReset();
    const reviewedOnCard = {
      ...reviewedProperty,
      editableOnCard: true,
      categoryIds: [bookmark.categoryId],
    };
    await renderWithRouter(
      <BookmarkCard
        bookmark={bookmark}
        properties={[reviewedOnCard]}
      />,
      {
        paths: [DETAIL_PATH],
      },
    );
    openMoreMenu();
    const item = await screen.findByRole("menuitemcheckbox", {
      name: "Reviewed",
    });
    fireEvent.click(item);
    expect(updateMutate).toHaveBeenCalledWith({
      id: bookmark.id,
      input: {
        booleanValues: [
          {
            propertyId: "prop-reviewed",
            value: true,
          },
        ],
      },
    });
  });

  it("toggles a clickable-in-view boolean by clicking its card badge", async () => {
    updateMutate.mockReset();
    const reviewedClickable = {
      ...reviewedProperty,
      clickableInView: true,
    };
    await renderWithRouter(
      <BookmarkCard
        bookmark={{
          ...bookmark,
          booleanValues: [
            {
              propertyId: "prop-reviewed",
              value: true,
            },
          ],
        }}
        properties={[reviewedClickable]}
      />,
      {
        paths: [DETAIL_PATH],
      },
    );
    fireEvent.click(screen.getByRole("button", {
      name: "Reviewed: Yes",
    }));
    expect(updateMutate).toHaveBeenCalledWith({
      id: bookmark.id,
      input: {
        booleanValues: [
          {
            propertyId: "prop-reviewed",
            value: false,
          },
        ],
      },
    });
  });

  it("does not make a boolean card badge clickable when clickableInView is off", async () => {
    await renderWithRouter(
      <BookmarkCard
        bookmark={{
          ...bookmark,
          booleanValues: [
            {
              propertyId: "prop-reviewed",
              value: true,
            },
          ],
        }}
        properties={[reviewedProperty]}
      />,
      {
        paths: [DETAIL_PATH],
      },
    );
    expect(screen.queryByRole("button", {
      name: "Reviewed: Yes",
    })).not.toBeInTheDocument();
    expect(screen.getByText("Reviewed: Yes")).toBeInTheDocument();
  });

  it("edits a number property from the card menu and saves on blur", async () => {
    updateMutate.mockReset();
    const starsOnCard = {
      ...starsProperty,
      editableOnCard: true,
      categoryIds: [bookmark.categoryId],
    };
    await renderWithRouter(
      <BookmarkCard
        bookmark={bookmark}
        properties={[starsOnCard]}
      />,
      {
        paths: [DETAIL_PATH],
      },
    );
    openMoreMenu();
    const input = await screen.findByLabelText("Stars (stars)");
    fireEvent.change(input, {
      target: {
        value: "4",
      },
    });
    fireEvent.blur(input);
    expect(updateMutate).toHaveBeenCalledWith({
      id: bookmark.id,
      input: {
        numberValues: [
          {
            propertyId: "prop-stars",
            value: 4,
          },
        ],
      },
    });
  });

  it("omits the card-menu editors for properties not opted in", async () => {
    await renderWithRouter(
      <BookmarkCard
        bookmark={bookmark}
        properties={[starsProperty, reviewedProperty]}
      />,
      {
        paths: [DETAIL_PATH],
      },
    );
    openMoreMenu();
    await screen.findByRole("menuitem", {
      name: "Edit",
    });
    expect(screen.queryByText("Quick edit")).not.toBeInTheDocument();
  });
});
