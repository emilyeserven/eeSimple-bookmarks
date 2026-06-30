import type { ImportRule } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyConditionTree } from "@eesimple/types";

import { ImportRuleConditionsForm } from "./ImportRuleConditionsForm";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const rule: ImportRule = {
  id: "rule-block-social",
  name: "Block social media",
  slug: "block-social-media",
  description: "Skip noisy social links.",
  conditions: emptyConditionTree(),
  action: "block",
  sortOrder: 0,
  createdAt: NOW,
};

const meta = {
  title: "Components/ImportRuleConditionsForm",
  component: ImportRuleConditionsForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    rule,
  },
} satisfies Meta<typeof ImportRuleConditionsForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The auto-saving conditions editor for an import rule (URL / Website matches only). */
export const Default: Story = {};
