import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProcessedItemsCard } from "./ProcessedItemsCard";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Settings/ProcessedItemsCard",
  component: ProcessedItemsCard,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof ProcessedItemsCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A card with a destructive button that sweeps processed inbox items. */
export const Default: Story = {};
