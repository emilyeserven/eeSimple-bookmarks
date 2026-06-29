import type { TabNavEntry } from "./TabbedEntityLayout";

import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TabbedEntityLayout } from "./TabbedEntityLayout";

const nav: readonly TabNavEntry[] = [
  {
    to: "/settings/display",
    label: "Display",
  },
  {
    to: "/settings/drawer",
    label: "Drawer",
  },
  {
    type: "group",
    label: "More Settings",
    items: [
      {
        to: "/settings/saved-filters",
        label: "Saved Filters",
      },
      {
        to: "/settings/advanced",
        label: "Advanced",
      },
    ],
  },
];

/**
 * Render the layout inside an in-memory router. The layout sits at the root (its `<Outlet/>` renders
 * the matched child); `initialPath` controls which route is active so we can assert tab/More
 * highlighting.
 */
async function renderLayout(initialPath = "/settings/display") {
  const rootRoute = createRootRoute({
    component: () => (
      <TabbedEntityLayout
        header={<h1>Settings</h1>}
        nav={nav}
        navAriaLabel="Settings sections"
      />
    ),
  });
  const paths = ["/settings/display", "/settings/drawer", "/settings/saved-filters", "/settings/advanced"];
  const children = paths.map(path =>
    createRoute({
      getParentRoute: () => rootRoute,
      path,
      component: () => <Outlet />,
    }));
  const router = createRouter({
    routeTree: rootRoute.addChildren(children),
    history: createMemoryHistory({
      initialEntries: [initialPath],
    }),
  });
  await router.load();
  return render(<RouterProvider router={router} />);
}

describe("TabbedEntityLayout", () => {
  it("renders top-level entries as tabs and the group behind a More button", async () => {
    await renderLayout();

    expect(screen.getByRole("link", {
      name: "Display",
    })).toBeInTheDocument();
    expect(screen.getByRole("button", {
      name: /More/,
    })).toBeInTheDocument();
    // Group items are collapsed into the dropdown, not rendered inline.
    expect(screen.queryByText("Saved Filters")).not.toBeInTheDocument();
    expect(screen.queryByText("More Settings")).not.toBeInTheDocument();
  });

  it("reveals the group items as links when the More menu opens", async () => {
    await renderLayout();

    const moreButton = screen.getByRole("button", {
      name: /More/,
    });
    // jsdom needs a keyboard event to open a Radix dropdown.
    fireEvent.keyDown(moreButton, {
      key: " ",
    });

    expect(await screen.findByRole("menuitem", {
      name: "Saved Filters",
    })).toBeInTheDocument();
    expect(await screen.findByRole("menuitem", {
      name: "Advanced",
    })).toBeInTheDocument();
  });

  it("highlights the More button when the active route is one of its items", async () => {
    await renderLayout("/settings/advanced");

    expect(screen.getByRole("button", {
      name: /More/,
    })).toHaveClass("bg-accent");
  });

  it("does not highlight the More button on a top-level route", async () => {
    await renderLayout("/settings/display");

    expect(screen.getByRole("button", {
      name: /More/,
    })).not.toHaveClass("bg-accent");
  });
});
