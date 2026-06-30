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

/** The top-level "New location" dialog, opened. */
export const Default: Story = {};

/** Nested under an existing location — the title and copy switch to "New sub-location". */
export const SubLocation: Story = {
  args: {
    defaultParentId: "location-parent",
  },
};
