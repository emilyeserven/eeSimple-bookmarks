import type { Meta, StoryObj } from "@storybook/react-vite";

import { AddMediaTypeModal } from "./AddMediaTypeModal";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/AddMediaTypeModal",
  component: AddMediaTypeModal,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
  },
} satisfies Meta<typeof AddMediaTypeModal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The top-level "New media type" dialog, opened. */
export const Default: Story = {};

/** Nested under an existing type — the title and copy switch to "New sub-type". */
export const SubType: Story = {
  args: {
    defaultParentId: "media-parent",
  },
};
