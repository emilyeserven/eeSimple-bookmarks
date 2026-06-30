import type { PropertyGroup } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { PropertyGroupGeneralForm } from "./PropertyGroupGeneralForm";
import { apiHandlers } from "../test-utils/story-mocks";

const group: PropertyGroup = {
  id: "group-reading",
  name: "Reading",
  slug: "reading",
  description: "Progress-tracking properties for books.",
  priority: 0,
  createdAt: "2026-06-01T00:00:00.000Z",
};

const meta = {
  title: "Components/PropertyGroupGeneralForm",
  component: PropertyGroupGeneralForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    group,
  },
} satisfies Meta<typeof PropertyGroupGeneralForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Name, priority, and description — each auto-saves on blur. */
export const Default: Story = {};

/** A group with no description. */
export const NoDescription: Story = {
  args: {
    group: {
      ...group,
      description: null,
    },
  },
};
