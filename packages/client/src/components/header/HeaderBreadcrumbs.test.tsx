import type { BreadcrumbSegment } from "./HeaderBreadcrumbs";
import type { EntityName } from "@eesimple/types";

import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HeaderBreadcrumbs } from "./HeaderBreadcrumbs";

import { renderWithRouter } from "@/test-utils/router";

/** A minimal language-labelled name for breadcrumb fixtures. */
function nm(value: string): EntityName {
  return {
    id: value,
    language: {
      id: value,
      name: value,
      slug: value,
      isoCode: null,
    },
    value,
    isPrimary: false,
    sortOrder: 0,
  };
}

describe("HeaderBreadcrumbs", () => {
  it("shows only the current entry on small screens, with a drawer for the full trail", async () => {
    const crumbs: BreadcrumbSegment[] = [
      {
        label: "Categories",
        href: "/categories",
      },
      {
        label: "Tech Stuff",
      },
    ];
    await renderWithRouter(<HeaderBreadcrumbs crumbs={crumbs} />, {
      paths: ["/categories"],
    });

    // Both layouts render (CSS toggles visibility): the inline trail and the stacked mobile nav.
    const navs = screen.getAllByRole("navigation", {
      name: "breadcrumb",
    });
    expect(navs).toHaveLength(2);

    // The stacked layout (rendered second) shows only the current page — the ancestor link is not
    // rendered inline; it lives in the (collapsed) trail drawer instead.
    const [, stackedNav] = navs;
    if (!stackedNav) throw new Error("expected the stacked breadcrumb nav");
    const stacked = within(stackedNav);
    expect(stacked.getByText("Tech Stuff")).toBeInTheDocument();
    expect(stacked.queryByRole("link", {
      name: "Categories",
    })).toBeNull();

    // Tapping the trail button opens the top drawer, revealing the full trail with the ancestor link.
    fireEvent.click(stacked.getByRole("button", {
      name: "Show breadcrumb trail",
    }));
    const link = await screen.findByRole("link", {
      name: "Categories",
    });
    expect(link).toHaveAttribute("href", "/categories");
  });

  it("stacks a language-labelled name beneath the label", async () => {
    await renderWithRouter(
      <HeaderBreadcrumbs
        crumbs={[
          {
            label: "Bookmarks",
            href: "/bookmarks",
          },
          {
            label: "東京",
            names: [nm("Tōkyō")],
          },
        ]}
      />,
      {
        paths: ["/bookmarks"],
      },
    );

    // The real name is primary and the language-labelled name is the de-emphasized secondary —
    // both render (twice: once per responsive layout).
    expect(screen.getAllByText("東京").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tōkyō").length).toBeGreaterThan(0);
  });

  it("collapses the middle crumbs into an ellipsis dropdown when there are more than 3", async () => {
    const crumbs: BreadcrumbSegment[] = [
      {
        label: "Tags",
        href: "/tags",
      },
      {
        label: "Parent",
        href: "/tags/parent",
      },
      {
        label: "Child",
        href: "/tags/child",
      },
      {
        label: "Grandchild",
        href: "/tags/grandchild",
      },
      {
        label: "Leaf",
      },
    ];
    await renderWithRouter(<HeaderBreadcrumbs crumbs={crumbs} />, {
      paths: ["/tags"],
    });

    // The wide-screen inline trail is the first breadcrumb nav.
    const [inlineNav] = screen.getAllByRole("navigation", {
      name: "breadcrumb",
    });
    if (!inlineNav) throw new Error("expected the inline breadcrumb nav");
    const inline = within(inlineNav);

    // First crumb and the last two stay visible; the middle ones are hidden behind the ellipsis.
    expect(inline.getByRole("link", {
      name: "Tags",
    })).toBeInTheDocument();
    expect(inline.getByRole("link", {
      name: "Grandchild",
    })).toBeInTheDocument();
    expect(inline.getByText("Leaf")).toBeInTheDocument();
    expect(inline.queryByRole("link", {
      name: "Parent",
    })).toBeNull();
    expect(inline.queryByRole("link", {
      name: "Child",
    })).toBeNull();

    // Opening the ellipsis dropdown reveals the hidden middle crumbs as working links. Radix opens
    // on keyboard in jsdom (which lacks PointerEvent).
    fireEvent.keyDown(inline.getByRole("button", {
      name: "Show hidden breadcrumbs",
    }), {
      key: " ",
    });
    const parentLink = await screen.findByRole("menuitem", {
      name: "Parent",
    });
    expect(parentLink).toHaveAttribute("href", "/tags/parent");
    expect(await screen.findByRole("menuitem", {
      name: "Child",
    })).toHaveAttribute("href", "/tags/child");
  });

  it("does not collapse a 3-crumb trail", async () => {
    await renderWithRouter(
      <HeaderBreadcrumbs
        crumbs={[
          {
            label: "Categories",
            href: "/categories",
          },
          {
            label: "Tech",
            href: "/categories/tech",
          },
          {
            label: "Edit",
          },
        ]}
      />,
      {
        paths: ["/categories"],
      },
    );

    const [inlineNav] = screen.getAllByRole("navigation", {
      name: "breadcrumb",
    });
    if (!inlineNav) throw new Error("expected the inline breadcrumb nav");
    const inline = within(inlineNav);
    expect(inline.queryByRole("button", {
      name: "Show hidden breadcrumbs",
    })).toBeNull();
    expect(inline.getByRole("link", {
      name: "Tech",
    })).toBeInTheDocument();
  });

  it("shows no parent links for a single (top-level) crumb", async () => {
    await renderWithRouter(
      <HeaderBreadcrumbs
        crumbs={[{
          label: "Bookmarks",
        }]}
      />,
    );

    const navs = screen.getAllByRole("navigation", {
      name: "breadcrumb",
    });
    const [, stackedNav] = navs;
    if (!stackedNav) throw new Error("expected the stacked breadcrumb nav");
    const stacked = within(stackedNav);
    expect(stacked.getByText("Bookmarks")).toBeInTheDocument();
    expect(stacked.queryAllByRole("link")).toHaveLength(0);
  });
});
