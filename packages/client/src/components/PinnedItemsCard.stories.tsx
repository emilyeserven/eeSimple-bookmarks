import type { Meta, StoryObj } from "@storybook/react-vite";

import { PinnedItemsCard } from "./PinnedItemsCard";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Settings/PinnedItemsCard",
  component: PinnedItemsCard,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof PinnedItemsCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
