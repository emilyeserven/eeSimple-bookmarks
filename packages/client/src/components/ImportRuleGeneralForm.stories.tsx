import type { Meta, StoryObj } from "@storybook/react-vite";

import { ImportRuleGeneralForm } from "./ImportRuleGeneralForm";
import { makeImportRule } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const rule = makeImportRule({
  id: "rule-block-social",
  name: "Block social media",
  slug: "block-social-media",
  description: "Reject links from social platforms before they reach the inbox.",
  action: "reject",
  sortOrder: 2,
});

const meta = {
  title: "Components/ImportRuleGeneralForm",
  component: ImportRuleGeneralForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    rule,
  },
} satisfies Meta<typeof ImportRuleGeneralForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Name, description, action, and priority — each auto-saves on blur/change. */
export const Default: Story = {};

/** A rule with no description and a "block" action. */
export const BlockNoDescription: Story = {
  args: {
    rule: {
      ...rule,
      name: "Block sponsored domains",
      description: null,
      action: "block",
    },
  },
};
