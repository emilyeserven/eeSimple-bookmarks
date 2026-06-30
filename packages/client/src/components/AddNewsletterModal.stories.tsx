import type { Meta, StoryObj } from "@storybook/react-vite";

import { AddNewsletterModal } from "./AddNewsletterModal";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/AddNewsletterModal",
  component: AddNewsletterModal,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
  },
} satisfies Meta<typeof AddNewsletterModal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The name-only inline-create dialog for a new import source, opened. */
export const Default: Story = {};
