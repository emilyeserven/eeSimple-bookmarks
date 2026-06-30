import type { Meta, StoryObj } from "@storybook/react-vite";

import { AddImportRuleModal } from "./AddImportRuleModal";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/AddImportRuleModal",
  component: AddImportRuleModal,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
  },
} satisfies Meta<typeof AddImportRuleModal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The name-only inline-create dialog for a new import rule, opened. */
export const Default: Story = {};
