import type { Meta, StoryObj } from "@storybook/react-vite";

import { AddCustomPropertyModal } from "./AddCustomPropertyModal";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/AddCustomPropertyModal",
  component: AddCustomPropertyModal,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
  },
} satisfies Meta<typeof AddCustomPropertyModal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The name + type create dialog, opened. */
export const Default: Story = {};
