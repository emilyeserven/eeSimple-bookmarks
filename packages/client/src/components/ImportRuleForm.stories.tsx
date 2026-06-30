import type { Meta, StoryObj } from "@storybook/react-vite";

import { ImportRuleForm } from "./ImportRuleForm";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/ImportRuleForm",
  component: ImportRuleForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    isError: false,
    onSubmit: () => {},
  },
} satisfies Meta<typeof ImportRuleForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The create-only name + action form for a new import rule. */
export const Default: Story = {};

/** With a custom submit label. */
export const CustomSubmitLabel: Story = {
  args: {
    submitLabel: "Create rule",
  },
};

/** Showing a server error message. */
export const WithError: Story = {
  args: {
    isError: true,
    errorMessage: "A rule with that name already exists.",
  },
};
