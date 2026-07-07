import type { Meta, StoryObj } from "@storybook/react-vite";

import { PropertyGroupGeneralForm } from "./PropertyGroupGeneralForm";
import { makePropertyGroup } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const group = makePropertyGroup({
  id: "group-reading",
  name: "Reading",
  slug: "reading",
  description: "Progress-tracking properties for books.",
});

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
