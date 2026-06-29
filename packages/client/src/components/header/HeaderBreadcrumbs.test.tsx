import type { BreadcrumbSegment } from "./HeaderBreadcrumbs";

import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HeaderBreadcrumbs } from "./HeaderBreadcrumbs";

import { renderWithRouter } from "@/test-utils/router";

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

  it("stacks the romanized form beneath the label", async () => {
    await renderWithRouter(
      <HeaderBreadcrumbs
        crumbs={[
          {
            label: "Bookmarks",
            href: "/bookmarks",
          },
          {
            label: "東京",
            romanizedLabel: "Tōkyō",
          },
        ]}
      />,
      {
        paths: ["/bookmarks"],
      },
    );

    // With "show romanized by default" off, the real name is primary and the romanized form is the
    // de-emphasized secondary — both render (twice: once per responsive layout).
    expect(screen.getAllByText("東京").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tōkyō").length).toBeGreaterThan(0);
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
