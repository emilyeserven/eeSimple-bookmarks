import type { Meta, StoryObj } from "@storybook/react-vite";

import { AddPersonModal } from "./AddPersonModal";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/AddPersonModal",
  component: AddPersonModal,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
  },
} satisfies Meta<typeof AddPersonModal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The name-only inline-create dialog, opened. */
export const Default: Story = {};
