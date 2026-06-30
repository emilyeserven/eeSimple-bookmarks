import type { PropertyGroup } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { PropertyGroupListItem } from "./PropertyGroupListItem";
import { apiHandlers } from "../test-utils/story-mocks";

const group: PropertyGroup = {
  id: "group-reading",
  name: "Reading",
  slug: "reading",
  description: "Progress-tracking properties for books.",
  priority: 0,
  createdAt: "2026-06-01T00:00:00.000Z",
  propertyCount: 3,
};

const meta = {
  title: "Components/PropertyGroupListItem",
  component: PropertyGroupListItem,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    group,
  },
} satisfies Meta<typeof PropertyGroupListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A single property-group row with a member-count badge and hover Edit / Info buttons. */
export const Default: Story = {};

/** An empty group — zero member count, de-emphasized; subtitle falls back to the priority. */
export const Empty: Story = {
  args: {
    group: {
      ...group,
      name: "Ratings",
      slug: "ratings",
      description: null,
      propertyCount: 0,
    },
  },
};
