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

// The detail body is now layout-driven and self-loads its data via hooks (bookmarks stay off
// `ENTITY_DESCRIPTORS`; the `"bookmark"` field registry feeds `LayoutDrivenTabBody`). Stub the data
// hooks so the General details + Properties tabs render from the sample fixtures without MSW, and
// resolve the layout to the code default (no stored override) so the tab/field order is the default.
vi.mock("../hooks/useCategories", async importOriginal => ({
  ...await importOriginal<typeof import("../hooks/useCategories")>(),
  useCategories: () => ({
    data: sampleCategories,
  }),
}));

vi.mock("../hooks/useCustomProperties", async importOriginal => ({
  ...await importOriginal<typeof import("../hooks/useCustomProperties")>(),
  useCustomProperties: () => ({
    data: sampleProperties,
  }),
}));

const updateMutate = vi.fn();
vi.mock("../hooks/useBookmarks", async importOriginal => ({
  ...await importOriginal<typeof import("../hooks/useBookmarks")>(),
  useBookmarks: () => ({
    data: [],
  }),
  useUpdateBookmark: () => ({
    mutate: updateMutate,
    isPending: false,
  }),
}));

vi.mock("../hooks/useEntityLayout", async importOriginal => ({
  ...await importOriginal<typeof import("../hooks/useEntityLayout")>(),
  // Resolve to the code default layout (no stored override), so the detail renders in default order.
  useResolvedWorkbenchLayout: (
    workbench: { defaultLayout?: unknown },
  ) => workbench.defaultLayout ?? null,
}));

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
    await renderDetail(<BookmarkDetail bookmark={sampleBookmark} />);
    expect(screen.getByRole("link", {
      name: "GitHub",
    })).toHaveAttribute("href", sampleBookmark.url);
  });

  it("shows the description, website, tags, and priority", async () => {
    await renderDetail(<BookmarkDetail bookmark={sampleBookmark} />);
    expect(screen.getByText("Where the code lives.")).toBeInTheDocument();
    expect(screen.getByText("GitHub (github.com)")).toBeInTheDocument();
    expect(screen.getByText("cli")).toBeInTheDocument();
    expect(screen.getByText("Priority")).toBeInTheDocument();
  });

  it("links the category to its page", async () => {
    await renderDetail(<BookmarkDetail bookmark={sampleBookmark} />);
    expect(screen.getByRole("link", {
      name: "Workflow",
    })).toHaveAttribute("href", "/categories/workflow");
  });

  it("formats number, calculate, and boolean property values", async () => {
    await renderDetail(<BookmarkDetail bookmark={sampleBookmark} />);
    // Effort carries a unit and pluralizes; Reviewed renders as Yes/No.
    expect(screen.getByText("3 points")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText(/calculated/)).toBeInTheDocument();
  });

  it("toggles a clickable-in-view boolean by clicking its label or value", async () => {
    updateMutate.mockClear();
    await renderDetail(<BookmarkDetail bookmark={sampleBookmark} />);
    fireEvent.click(screen.getByRole("button", {
      name: "Reviewed:",
    }));
    fireEvent.click(screen.getByRole("button", {
      name: "Yes",
    }));
    // The in-view boolean toggle now persists through the bookmark's own update mutation.
    expect(updateMutate).toHaveBeenCalledTimes(2);
  });

  it("invokes the edit and delete callbacks", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    await renderDetail(
      <BookmarkDetail
        bookmark={sampleBookmark}
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
