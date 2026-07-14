import type { Meta, StoryObj } from "@storybook/react-vite";

import { AutofillRuleGeneralForm } from "./AutofillRuleGeneralForm";
import { makeAutofillRule } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const rule = makeAutofillRule({
  id: "rule-recipes",
  name: "Recipes",
  slug: "recipes",
  description: "Auto-tag recipe links from 101 Cookbooks.",
  sortOrder: 3,
});

const meta = {
  title: "Components/AutofillRuleGeneralForm",
  component: AutofillRuleGeneralForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    rule,
  },
} satisfies Meta<typeof AutofillRuleGeneralForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Name, description, and priority — each auto-saves on blur. */
export const Default: Story = {};

/** A rule with no description. */
export const NoDescription: Story = {
  args: {
    rule: {
      ...rule,
      description: null,
    },
  },
};
