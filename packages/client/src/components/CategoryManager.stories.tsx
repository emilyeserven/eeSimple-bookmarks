import type { Meta, StoryObj } from "@storybook/react-vite";

import { CategoryManager } from "./CategoryManager";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Settings/CategoryManager",
  component: CategoryManager,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof CategoryManager>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
