import type { AutofillRule } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyConditionTree } from "@eesimple/types";

import { AutofillRuleConditionsForm } from "./AutofillRuleConditionsForm";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const rule: AutofillRule = {
  id: "rule-recipes",
  name: "Recipes",
  slug: "recipes",
  description: "Tag recipe links",
  conditions: {
    type: "group",
    combinator: "and",
    children: [
      {
        type: "match",
        field: "url",
        operator: "domain",
        pattern: "101cookbooks.com",
      },
    ],
  },
  setCategoryId: "cat-workflow",
  setMediaTypeId: null,
  tagIds: ["tag-cli"],
  locationIds: [],
  numberValues: [],
  booleanValues: [],
  dateTimeValues: [],
  sortOrder: 3,
  createdAt: NOW,
};

const meta = {
  title: "Components/AutofillRuleConditionsForm",
  component: AutofillRuleConditionsForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    rule,
  },
} satisfies Meta<typeof AutofillRuleConditionsForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Editing a rule's activation conditions (auto-saves on change). */
export const Default: Story = {};

/** A rule with no conditions set yet. */
export const NoConditions: Story = {
  args: {
    rule: {
      ...rule,
      conditions: emptyConditionTree(),
    },
  },
};
