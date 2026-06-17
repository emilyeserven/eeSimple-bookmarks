import type { Meta, StoryObj } from "@storybook/react-vite";

import { PropertyTagManager } from "./PropertyTagManager";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Settings/PropertyTagManager",
  component: PropertyTagManager,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    propertyId: "prop-topic",
  },
} satisfies Meta<typeof PropertyTagManager>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
