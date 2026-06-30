import type { Meta, StoryObj } from "@storybook/react-vite";

import { AddLocationModal } from "./AddLocationModal";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/AddLocationModal",
  component: AddLocationModal,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
  },
} satisfies Meta<typeof AddLocationModal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The "New location" dialog, opened, with the full location form. */
export const Default: Story = {};
