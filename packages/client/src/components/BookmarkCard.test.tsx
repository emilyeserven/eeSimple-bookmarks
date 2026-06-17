import type { Bookmark } from "@eesimple/types";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BookmarkCard } from "./BookmarkCard";

const bookmark: Bookmark = {
  id: "11111111-1111-1111-1111-111111111111",
  url: "https://github.com",
  title: "GitHub",
  description: "Where the code lives.",
  tags: ["dev", "tools"],
  favorite: true,
  createdAt: "2026-06-01T00:00:00.000Z",
};

describe("BookmarkCard", () => {
  it("renders the bookmark title and description", () => {
    render(<BookmarkCard bookmark={bookmark} />);
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("Where the code lives.")).toBeInTheDocument();
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
