import type { BookmarkSearch } from "../lib/bookmarkSearch";
import type { TagNode } from "@eesimple/types";
import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FilterPillsRow } from "./FilterPillsRow";
import { makeCategory, makeTag } from "../test-utils/factories";

// The language-usage pill self-fetches both vocabularies and returns null when both are empty; give it
// one entry each so the "only a language usage is active" case can assert the pill renders.
vi.mock("../hooks/useLanguages", () => ({
  useLanguages: () => ({
    data: [{
      id: "lang-en",
      name: "English",
    }],
  }),
}));
vi.mock("../hooks/useLanguageUsageLevels", () => ({
  useLanguageUsageLevels: () => ({
    data: [{
      id: "level-dub",
      name: "Dub",
      kind: "availability",
    }],
  }),
}));

/** Render under a QueryClient so the display-preference hooks (on-demand/order) resolve to defaults. */
function renderWithClient(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const tree: TagNode[] = [
  {
    ...makeTag({
      id: "dev",
      name: "dev",
      slug: "dev",
    }),
    children: [],
  },
];
const categories = [makeCategory({
  id: "cat-1",
  name: "Workflow",
  slug: "workflow",
})];

describe("FilterPillsRow activeOnly", () => {
  it("renders only pills with an active selection and no Add-filter control", () => {
    const search: BookmarkSearch = {
      categories: ["cat-1"],
    };
    renderWithClient(
      <FilterPillsRow
        tree={tree}
        properties={[]}
        categories={categories}
        bookmarks={[]}
        search={search}
        onSearchChange={vi.fn()}
        activeOnly
      />,
    );

    // The active Category facet shows; the inactive Tags facet and the Add-filter control do not.
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.queryByText("Tags")).not.toBeInTheDocument();
    expect(screen.queryByText("Add filter")).not.toBeInTheDocument();
  });

  it("keeps the language-usage pill when only a language usage is active", () => {
    renderWithClient(
      <FilterPillsRow
        tree={tree}
        properties={[]}
        categories={categories}
        bookmarks={[]}
        search={{
          languageUsageLevels: ["level-dub"],
        }}
        onSearchChange={vi.fn()}
        activeOnly
      />,
    );

    expect(screen.getByText("Language usage")).toBeInTheDocument();
    expect(screen.queryByText("Category")).not.toBeInTheDocument();
  });

  it("returns null when nothing is active", () => {
    const {
      container,
    } = renderWithClient(
      <FilterPillsRow
        tree={tree}
        properties={[]}
        categories={categories}
        bookmarks={[]}
        search={{}}
        onSearchChange={vi.fn()}
        activeOnly
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the inactive Tags facet and the Add-filter affordance without activeOnly", () => {
    renderWithClient(
      <FilterPillsRow
        tree={tree}
        properties={[]}
        categories={categories}
        bookmarks={[]}
        search={{}}
        onSearchChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Tags")).toBeInTheDocument();
  });
});
