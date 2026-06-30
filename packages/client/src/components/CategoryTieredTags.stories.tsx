import type { Meta, StoryObj } from "@storybook/react-vite";

import { CategoryTieredTags } from "./CategoryTieredTags";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/CategoryTieredTags",
  component: CategoryTieredTags,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    categoryId: "cat-workflow",
  },
} satisfies Meta<typeof CategoryTieredTags>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
