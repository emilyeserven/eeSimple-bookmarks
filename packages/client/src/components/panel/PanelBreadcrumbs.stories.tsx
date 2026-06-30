import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";

import { PanelBreadcrumbs } from "./PanelBreadcrumbs";
import { apiHandlers } from "../../test-utils/story-mocks";

/**
 * The panel breadcrumbs read the drawer params (`dCT`/`dCId`/`dMode`) from the router search, so
 * each story mounts its own memory router seeded with the search state it wants to illustrate.
 */
function panelRouter(search: string) {
  const rootRoute = createRootRoute({
    component: () => <PanelBreadcrumbs />,
  });
  return createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({
      initialEntries: [`/${search}`],
    }),
  });
}

const meta = {
  title: "Components/Panel/PanelBreadcrumbs",
  component: PanelBreadcrumbs,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof PanelBreadcrumbs>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A content type's list: `Browse → Categories`. */
export const TypeList: Story = {
  render: () => (
    <RouterProvider router={panelRouter("?dOpen=true&dCT=category") as never} />
  ),
};

/** A single item: `Browse → Categories → Workflow`. */
export const Item: Story = {
  render: () => (
    <RouterProvider
      router={panelRouter("?dOpen=true&dCT=category&dCId=cat-workflow&dMode=view") as never}
    />
  ),
};

/** A registry-less view (Notifications): `Browse → Notifications`. */
export const Notifications: Story = {
  render: () => (
    <RouterProvider router={panelRouter("?dOpen=true&dCT=notifications") as never} />
  ),
};
