import type { PropertyGroup } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { PropertyDisplayEditForm } from "./PropertyDisplayEditForm";
import { makeCustomProperty } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const propertyGroups: PropertyGroup[] = [
  {
    id: "group-1",
    name: "Reading",
    slug: "reading",
    description: null,
    priority: 0,
    createdAt: NOW,
  },
  {
    id: "group-2",
    name: "Metadata",
    slug: "metadata",
    description: null,
    priority: 1,
    createdAt: NOW,
  },
];

const meta = {
  title: "Components/PropertyDisplayEditForm",
  component: PropertyDisplayEditForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    property: makeCustomProperty({
      id: "rating",
      name: "Rating",
      slug: "rating",
      type: "ratingScale",
      propertyGroupId: "group-1",
    }),
    propertyGroups,
  },
} satisfies Meta<typeof PropertyDisplayEditForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The Display edit tab; each control auto-saves on change (no Save button). */
export const Default: Story = {};

/** An ungrouped property with no group assigned. */
export const Ungrouped: Story = {
  args: {
    property: makeCustomProperty({
      id: "notes",
      name: "Notes",
      slug: "notes",
      type: "text",
      propertyGroupId: null,
    }),
  },
};
