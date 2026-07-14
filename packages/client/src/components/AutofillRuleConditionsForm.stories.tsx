import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyConditionTree } from "@eesimple/types";

import { AutofillRuleConditionsForm } from "./AutofillRuleConditionsForm";
import { makeAutofillRule } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const rule = makeAutofillRule({
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
  tagIds: ["tag-cli"],
  sortOrder: 3,
});

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
