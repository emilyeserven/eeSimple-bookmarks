import type { Meta, StoryObj } from "@storybook/react-vite";

import { AddAutofillRuleModal } from "./AddAutofillRuleModal";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/AddAutofillRuleModal",
  component: AddAutofillRuleModal,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    open: true,
    onOpenChange: () => {},
  },
} satisfies Meta<typeof AddAutofillRuleModal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The name-only inline-create dialog for a new autofill rule, opened. */
export const Default: Story = {};
