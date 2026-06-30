import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";

import { PanelContent } from "./PanelContent";
import { apiHandlers } from "../../test-utils/story-mocks";

/**
 * `PanelContent` routes its body through the drawer params (`dCT`/`dCId`/`dMode`) read from the
 * router search, so each story mounts a memory router seeded with the state it illustrates.
 */
function panelRouter(search: string) {
  const rootRoute = createRootRoute({
    component: () => (
      <div className="w-96">
        <PanelContent />
      </div>
    ),
  });
  return createRouter({
    routeTree: rootRoute,
    history: createMemoryHistory({
      initialEntries: [`/${search}`],
    }),
  });
}

const meta = {
  title: "Components/Panel/PanelContent",
  component: PanelContent,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof PanelContent>;

export default meta;

type Story = StoryObj<typeof meta>;

/** No content type selected — the content-type tiles. */
export const Tiles: Story = {
  render: () => <RouterProvider router={panelRouter("?dOpen=true") as never} />,
};

/** A content type selected — its searchable list (Categories). */
export const TypeList: Story = {
  render: () => (
    <RouterProvider router={panelRouter("?dOpen=true&dCT=category") as never} />
  ),
};

/** The registry-less Notifications view. */
export const Notifications: Story = {
  render: () => (
    <RouterProvider router={panelRouter("?dOpen=true&dCT=notifications") as never} />
  ),
};
