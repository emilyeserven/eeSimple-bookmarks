import type { Meta, StoryObj } from "@storybook/react-vite";

import { CreateImportRule } from "./ImportRuleForms";
import { apiHandlers } from "../../test-utils/story-mocks";

const meta = {
  title: "Components/Panel/CreateImportRule",
  component: CreateImportRule,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof CreateImportRule>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The panel's inline create form for a new import rule. */
export const Default: Story = {};
