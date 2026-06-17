import type { Bookmark, CustomProperty } from "@eesimple/types";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BookmarkCard } from "./BookmarkCard";

const bookmark: Bookmark = {
  id: "11111111-1111-1111-1111-111111111111",
  url: "https://github.com",
  title: "GitHub",
  description: "Where the code lives.",
  categoryId: "22222222-2222-2222-2222-222222222222",
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
  numberMin: null,
  numberMax: null,
  unitSingular: "star",
  unitPlural: "stars",
  operandPropertyIds: [],
  categoryIds: [],
  showInForm: false,
  createdAt: "2026-06-01T00:00:00.000Z",
};

const reviewedProperty: CustomProperty = {
  id: "prop-reviewed",
  name: "Reviewed",
  type: "boolean",
  numberMin: null,
  numberMax: null,
  unitSingular: null,
  unitPlural: null,
  operandPropertyIds: [],
  categoryIds: [],
  showInForm: false,
  createdAt: "2026-06-01T00:00:00.000Z",
};

describe("BookmarkCard", () => {
  it("renders the bookmark title and description", () => {
    render(<BookmarkCard bookmark={bookmark} />);
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("Where the code lives.")).toBeInTheDocument();
  });

  it("renders each assigned tag name", () => {
    render(<BookmarkCard bookmark={bookmark} />);
    expect(screen.getByText("dev")).toBeInTheDocument();
    expect(screen.getByText("tools")).toBeInTheDocument();
  });

  it("pluralizes a number value's unit and renders boolean values", () => {
    render(
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
    );
    expect(screen.getByText("Stars: 1 star")).toBeInTheDocument();
    expect(screen.getByText("Reviewed: Yes")).toBeInTheDocument();
  });

  it("uses the plural unit for a value other than one", () => {
    render(
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
    );
    expect(screen.getByText("Stars: 3 stars")).toBeInTheDocument();
  });

  it("calls onDelete with the bookmark id when the delete button is clicked", () => {
    const onDelete = vi.fn();
    render(
      <BookmarkCard
        bookmark={bookmark}
        onDelete={onDelete}
      />,
    );
    screen.getByRole("button", {
      name: "Delete",
    }).click();
    expect(onDelete).toHaveBeenCalledWith(bookmark.id);
  });
});
