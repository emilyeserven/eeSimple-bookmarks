import type { PropertyGroup } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { PropertyGroupsListing } from "./PropertyGroupManager";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const groups: PropertyGroup[] = [
  {
    id: "group-reading",
    name: "Reading",
    slug: "reading",
    description: "Progress-tracking properties.",
    priority: 0,
    createdAt: NOW,
    propertyCount: 3,
  },
  {
    id: "group-ratings",
    name: "Ratings",
    slug: "ratings",
    description: null,
    priority: 1,
    createdAt: NOW,
    propertyCount: 1,
  },
];

const meta = {
  title: "Components/PropertyGroupsListing",
  component: PropertyGroupsListing,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/property-groups", () => HttpResponse.json(groups)),
        ...apiHandlers,
      ],
    },
  },
} satisfies Meta<typeof PropertyGroupsListing>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The browsable, searchable property-group listing populated with a couple of groups. */
export const Default: Story = {};

/** No property groups yet — the empty-state message is shown. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/property-groups", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
};
