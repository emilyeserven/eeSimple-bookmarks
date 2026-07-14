import type { Meta, StoryObj } from "@storybook/react-vite";

import { ImportRuleListItem } from "./ImportRuleListItem";
import { makeImportRule } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const rule = makeImportRule({
  id: "rule-block-social",
  name: "Block social media",
  slug: "block-social-media",
  conditions: {
    type: "group",
    combinator: "and",
    children: [
      {
        type: "website",
        domains: ["twitter.com", "facebook.com"],
      },
    ],
  },
  action: "reject",
  sortOrder: 2,
});

const meta = {
  title: "Components/ImportRuleListItem",
  component: ImportRuleListItem,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    rule,
  },
} satisfies Meta<typeof ImportRuleListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A reject rule with a condition summary subtitle and a "Reject" action badge. */
export const Default: Story = {};

/** An approve rule. */
export const Approve: Story = {
  args: {
    rule: {
      ...rule,
      name: "Auto-approve newsletter links",
      action: "approve",
    },
  },
};

/** A block rule. */
export const Block: Story = {
  args: {
    rule: {
      ...rule,
      name: "Block ad networks",
      action: "block",
    },
  },
};
