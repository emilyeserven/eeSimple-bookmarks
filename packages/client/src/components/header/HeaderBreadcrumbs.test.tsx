import type { BreadcrumbSegment } from "./HeaderBreadcrumbs";

import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HeaderBreadcrumbs } from "./HeaderBreadcrumbs";

import { renderWithRouter } from "@/test-utils/router";

describe("HeaderBreadcrumbs", () => {
  it("stacks parent crumbs above the current page on small screens", async () => {
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

    // The stacked layout (rendered second) keeps the parent as a link and the current page as text.
    const [, stackedNav] = navs;
    if (!stackedNav) throw new Error("expected the stacked breadcrumb nav");
    const stacked = within(stackedNav);
    expect(stacked.getByRole("link", {
      name: "Categories",
    })).toHaveAttribute("href", "/categories");
    expect(stacked.getByText("Tech Stuff")).toBeInTheDocument();
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
