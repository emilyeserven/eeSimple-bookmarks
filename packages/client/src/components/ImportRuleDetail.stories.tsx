import type { ConditionTree } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { ImportRuleConditionsFields, ImportRuleGeneralFields } from "./ImportRuleDetail";
import { makeImportRule } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const conditions: ConditionTree = {
  type: "group",
  combinator: "or",
  children: [
    {
      type: "match",
      field: "url",
      operator: "domain",
      pattern: "twitter.com",
    },
    {
      type: "match",
      field: "title",
      operator: "contains",
      pattern: "sponsored",
    },
  ],
};

const rule = makeImportRule({
  id: "rule-block-social",
  name: "Block social media",
  slug: "block-social-media",
  description: "Skip noisy social and sponsored links.",
  conditions,
  action: "block",
  sortOrder: 2,
});

const meta = {
  title: "Components/ImportRuleDetail",
  component: ImportRuleGeneralFields,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    rule,
  },
} satisfies Meta<typeof ImportRuleGeneralFields>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The General view tab: action badge, priority, slug, date, and description. */
export const General: Story = {};

/** The same rule with no description. */
export const NoDescription: Story = {
  args: {
    rule: {
      ...rule,
      description: null,
    },
  },
};

/** The Conditions view tab: a detailed breakdown of the condition tree. */
export const Conditions: Story = {
  render: () => <ImportRuleConditionsFields rule={rule} />,
};

/** A rule that always matches (no conditions set). */
export const AlwaysMatches: Story = {
  render: () => (
    <ImportRuleConditionsFields
      rule={{
        ...rule,
        conditions: {
          type: "group",
          combinator: "and",
          children: [],
        },
      }}
    />
  ),
};
