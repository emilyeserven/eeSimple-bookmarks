import type { LocationNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { LocationHierarchyView } from "./locationHierarchyView";
import { makeLocation } from "../../test-utils/factories";
import { apiHandlers } from "../../test-utils/story-mocks";

function node(overrides: Partial<LocationNode>): LocationNode {
  return {
    ...makeLocation(),
    children: [],
    ...overrides,
  };
}

const tokyo = node({
  id: "loc-tokyo",
  name: "Tokyo",
  slug: "tokyo",
  parentId: "loc-japan",
  placeType: "city",
  children: [
    node({
      id: "loc-shibuya",
      name: "Shibuya",
      slug: "shibuya",
      parentId: "loc-tokyo",
      placeType: "ward",
    }),
  ],
});

const japan = node({
  id: "loc-japan",
  name: "Japan",
  slug: "japan",
  placeType: "country",
  children: [tokyo],
});

const handlers = [
  http.get("/api/locations/tree", () => HttpResponse.json([japan])),
  ...apiHandlers,
];

const meta = {
  title: "Workbench/LocationHierarchyView",
  component: LocationHierarchyView,
  parameters: {
    msw: {
      handlers,
    },
  },
  args: {
    entity: tokyo,
  },
} satisfies Meta<typeof LocationHierarchyView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A mid-tree location: one ancestor (Japan) and one child (Shibuya). */
export const Default: Story = {};

/** A leaf location with no children. */
export const Leaf: Story = {
  args: {
    entity: node({
      id: "loc-shibuya",
      name: "Shibuya",
      slug: "shibuya",
      parentId: "loc-tokyo",
    }),
  },
};
