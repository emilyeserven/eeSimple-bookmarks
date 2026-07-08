import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CategoryBookmarkData, TreeData } from "./breadcrumbSwitcherData";
import type { TaxonomySwitcherData } from "./breadcrumbSwitcherTaxonomyData";
import type { TagNode } from "@eesimple/types";

import { useSwitcherOptions } from "./breadcrumbSwitcherOptions";

const {
  mockUseCategoryBookmarkData, mockUseTreeSwitcherData,
} = vi.hoisted(() => ({
  mockUseCategoryBookmarkData: vi.fn<() => CategoryBookmarkData>(),
  mockUseTreeSwitcherData: vi.fn<() => TreeData>(),
}));
const {
  mockUseTaxonomySwitcherData,
} = vi.hoisted(() => ({
  mockUseTaxonomySwitcherData: vi.fn<() => TaxonomySwitcherData>(),
}));

vi.mock("./breadcrumbSwitcherData", () => ({
  useCategoryBookmarkData: mockUseCategoryBookmarkData,
  useTreeSwitcherData: mockUseTreeSwitcherData,
}));
vi.mock("./breadcrumbSwitcherTaxonomyData", () => ({
  useTaxonomySwitcherData: mockUseTaxonomySwitcherData,
}));

function tagNode(overrides: Partial<TagNode> & Pick<TagNode, "id" | "slug" | "name">): TagNode {
  return {
    children: [],
    ...overrides,
  } as TagNode;
}

const emptyCategoryBookmarkData: CategoryBookmarkData = {
  categories: undefined,
  categoriesLoading: false,
  bookmarks: undefined,
  bookmarksLoading: false,
};
const emptyTreeData: TreeData = {
  roots: undefined,
  isLoading: false,
};
const emptyTaxonomyData: TaxonomySwitcherData = {
  lists: {
    websites: undefined,
    channels: undefined,
    properties: undefined,
    rules: undefined,
    importRules: undefined,
  },
  loadingByEntity: {
    "website": false,
    "youtube-channel": false,
    "custom-property": false,
    "autofill": false,
    "import-rule": false,
  },
};

describe("useSwitcherOptions", () => {
  it("builds category options from cached categories", () => {
    mockUseCategoryBookmarkData.mockReturnValue({
      ...emptyCategoryBookmarkData,
      categories: [
        {
          slug: "dev",
          name: "Dev",
        } as never,
      ],
      categoriesLoading: true,
    });
    mockUseTreeSwitcherData.mockReturnValue(emptyTreeData);
    mockUseTaxonomySwitcherData.mockReturnValue(emptyTaxonomyData);

    const {
      result,
    } = renderHook(() => useSwitcherOptions({
      kind: "category",
      currentSlug: "dev",
    }));

    expect(result.current.options).toEqual([{
      value: "dev",
      label: "Dev",
      href: "/categories/dev",
    }]);
    expect(result.current.currentValue).toBe("dev");
    expect(result.current.isLoading).toBe(true);
  });

  it("filters bookmark options to the given category", () => {
    mockUseCategoryBookmarkData.mockReturnValue({
      ...emptyCategoryBookmarkData,
      bookmarks: [
        {
          id: "b1",
          title: "In category",
          categoryId: "cat-1",
        } as never,
        {
          id: "b2",
          title: "Other category",
          categoryId: "cat-2",
        } as never,
      ],
    });
    mockUseTreeSwitcherData.mockReturnValue(emptyTreeData);
    mockUseTaxonomySwitcherData.mockReturnValue(emptyTaxonomyData);

    const {
      result,
    } = renderHook(() => useSwitcherOptions({
      kind: "bookmark",
      categoryId: "cat-1",
      currentId: "b1",
    }));

    expect(result.current.options).toEqual([{
      value: "b1",
      label: "In category",
      href: "/bookmarks/b1",
    }]);
    expect(result.current.currentValue).toBe("b1");
  });

  it("returns root siblings for treeSiblings when parentId is null", () => {
    const roots = [tagNode({
      id: "root-1",
      slug: "root-tag",
      name: "Root Tag",
    })];
    mockUseCategoryBookmarkData.mockReturnValue(emptyCategoryBookmarkData);
    mockUseTreeSwitcherData.mockReturnValue({
      roots,
      isLoading: false,
    });
    mockUseTaxonomySwitcherData.mockReturnValue(emptyTaxonomyData);

    const {
      result,
    } = renderHook(() => useSwitcherOptions({
      kind: "treeSiblings",
      tree: "tag",
      parentId: null,
      currentSlug: "root-tag",
    }));

    expect(result.current.options).toEqual([{
      value: "root-tag",
      label: "Root Tag",
      href: "/tags/root-tag",
    }]);
  });

  it("returns a node's children for treeSiblings when parentId is set", () => {
    const child = tagNode({
      id: "child-1",
      slug: "child-tag",
      name: "Child Tag",
    });
    const roots = [tagNode({
      id: "parent-1",
      slug: "parent-tag",
      name: "Parent Tag",
      children: [child],
    })];
    mockUseCategoryBookmarkData.mockReturnValue(emptyCategoryBookmarkData);
    mockUseTreeSwitcherData.mockReturnValue({
      roots,
      isLoading: false,
    });
    mockUseTaxonomySwitcherData.mockReturnValue(emptyTaxonomyData);

    const {
      result,
    } = renderHook(() => useSwitcherOptions({
      kind: "treeSiblings",
      tree: "tag",
      parentId: "parent-1",
      currentSlug: "child-tag",
    }));

    expect(result.current.options).toEqual([{
      value: "child-tag",
      label: "Child Tag",
      href: "/tags/child-tag",
    }]);
  });

  it("returns no siblings when the parent node isn't found", () => {
    mockUseCategoryBookmarkData.mockReturnValue(emptyCategoryBookmarkData);
    mockUseTreeSwitcherData.mockReturnValue({
      roots: [tagNode({
        id: "root-1",
        slug: "root-tag",
        name: "Root Tag",
      })],
      isLoading: false,
    });
    mockUseTaxonomySwitcherData.mockReturnValue(emptyTaxonomyData);

    const {
      result,
    } = renderHook(() => useSwitcherOptions({
      kind: "treeSiblings",
      tree: "tag",
      parentId: "missing",
      currentSlug: "child-tag",
    }));

    expect(result.current.options).toEqual([]);
  });

  it("builds taxonomy options with the correct href prefix per entity", () => {
    mockUseCategoryBookmarkData.mockReturnValue(emptyCategoryBookmarkData);
    mockUseTreeSwitcherData.mockReturnValue(emptyTreeData);
    mockUseTaxonomySwitcherData.mockReturnValue({
      lists: {
        ...emptyTaxonomyData.lists,
        websites: [{
          slug: "example-com",
          siteName: "Example",
        } as never],
        properties: [{
          slug: "rating",
          name: "Rating",
        } as never],
      },
      loadingByEntity: {
        ...emptyTaxonomyData.loadingByEntity,
        website: true,
      },
    });

    const {
      result: websiteResult,
    } = renderHook(() => useSwitcherOptions({
      kind: "taxonomy",
      entity: "website",
      currentSlug: "example-com",
    }));
    expect(websiteResult.current.options).toEqual([{
      value: "example-com",
      label: "Example",
      href: "/taxonomies/websites/example-com",
    }]);
    expect(websiteResult.current.isLoading).toBe(true);

    const {
      result: propertyResult,
    } = renderHook(() => useSwitcherOptions({
      kind: "taxonomy",
      entity: "custom-property",
      currentSlug: "rating",
    }));
    expect(propertyResult.current.options).toEqual([{
      value: "rating",
      label: "Rating",
      href: "/custom-properties/rating",
    }]);
  });
});
