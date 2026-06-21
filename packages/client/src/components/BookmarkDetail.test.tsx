import { emptyCardFieldZones } from "@eesimple/types";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BookmarkDetail } from "./BookmarkDetail";
import { renderWithRouter } from "../test-utils/router";
import {
  sampleBookmark,
  sampleCategories,
  sampleProperties,
} from "../test-utils/story-mocks";

// The per-card boolean display knobs (e.g. `clickableInView`) come from the Default card display
// rule; stub it so the detail view resolves the reviewed property as a clickable toggle.
vi.mock("../hooks/useCardDisplayRules", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../hooks/useCardDisplayRules")>();
  const zones = emptyCardFieldZones();
  zones["card-labels"].push({
    key: "prop-reviewed",
    clickableInView: true,
  });
  return {
    ...actual,
    useCardDisplayRules: () => ({
      data: [{
        isDefault: true,
        fieldZones: zones,
      }],
    }),
  };
});

const CATEGORY_PATH = "/categories/$categorySlug";

function renderDetail(ui: Parameters<typeof renderWithRouter>[0]) {
  return renderWithRouter(ui, {
    paths: [CATEGORY_PATH],
  });
}

describe("BookmarkDetail", () => {
  it("shows the title linking to the bookmark url", async () => {
    await renderDetail(
      <BookmarkDetail
        bookmark={sampleBookmark}
        categories={sampleCategories}
        properties={sampleProperties}
      />,
    );
    expect(screen.getByRole("link", {
      name: "GitHub",
    })).toHaveAttribute("href", sampleBookmark.url);
  });

  it("shows the description, website, tags, and priority", async () => {
    await renderDetail(
      <BookmarkDetail
        bookmark={sampleBookmark}
        categories={sampleCategories}
        properties={sampleProperties}
      />,
    );
    expect(screen.getByText("Where the code lives.")).toBeInTheDocument();
    expect(screen.getByText("GitHub (github.com)")).toBeInTheDocument();
    expect(screen.getByText("cli")).toBeInTheDocument();
    expect(screen.getByText("Priority")).toBeInTheDocument();
  });

  it("links the category to its page", async () => {
    await renderDetail(
      <BookmarkDetail
        bookmark={sampleBookmark}
        categories={sampleCategories}
        properties={sampleProperties}
      />,
    );
    expect(screen.getByRole("link", {
      name: "Workflow",
    })).toHaveAttribute("href", "/categories/workflow");
  });

  it("formats number, calculate, and boolean property values", async () => {
    await renderDetail(
      <BookmarkDetail
        bookmark={sampleBookmark}
        categories={sampleCategories}
        properties={sampleProperties}
      />,
    );
    // Effort carries a unit and pluralizes; Reviewed renders as Yes/No.
    expect(screen.getByText("3 points")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText(/calculated/)).toBeInTheDocument();
  });

  it("toggles a clickable-in-view boolean by clicking its label or value", async () => {
    const onSaveBoolean = vi.fn();
    await renderDetail(
      <BookmarkDetail
        bookmark={sampleBookmark}
        categories={sampleCategories}
        properties={sampleProperties}
        onSaveBoolean={onSaveBoolean}
      />,
    );
    fireEvent.click(screen.getByRole("button", {
      name: "Reviewed:",
    }));
    fireEvent.click(screen.getByRole("button", {
      name: "Yes",
    }));
    expect(onSaveBoolean).toHaveBeenCalledTimes(2);
    expect(onSaveBoolean).toHaveBeenCalledWith("prop-reviewed", false);
  });

  it("invokes the edit and delete callbacks", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    await renderDetail(
      <BookmarkDetail
        bookmark={sampleBookmark}
        categories={sampleCategories}
        properties={sampleProperties}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );
    screen.getByRole("button", {
      name: "Edit",
    }).click();
    screen.getByRole("button", {
      name: "Delete",
    }).click();
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
