import type { ImportRule } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyConditionTree } from "@eesimple/types";

import { ImportRuleGeneralForm } from "./ImportRuleGeneralForm";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const rule: ImportRule = {
  id: "rule-block-social",
  name: "Block social media",
  slug: "block-social-media",
  description: "Reject links from social platforms before they reach the inbox.",
  conditions: emptyConditionTree(),
  action: "reject",
  sortOrder: 2,
  createdAt: NOW,
};

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
