import type { Meta, StoryObj } from "@storybook/react-vite";

import { AddAuthorModal } from "./AddAuthorModal";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/AddAuthorModal",
  component: AddAuthorModal,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
  },
} satisfies Meta<typeof AddAuthorModal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The name-only inline-create dialog, opened. */
export const Default: Story = {};
