import type { Meta, StoryObj } from "@storybook/react-vite";

import { CustomPropertyManager } from "./CustomPropertyManager";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Settings/CustomPropertyManager",
  component: CustomPropertyManager,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof CustomPropertyManager>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
