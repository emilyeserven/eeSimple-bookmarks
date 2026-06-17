import type { Meta, StoryObj } from "@storybook/react-vite";

import { TagManager } from "./TagManager";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Tags/TagManager",
  component: TagManager,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof TagManager>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
