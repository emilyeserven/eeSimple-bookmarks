import type { ConditionTree } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyConditionTree } from "@eesimple/types";

import { AutofillRuleActivationSection } from "./AutofillRuleActivationSection";
import {
  apiHandlers,
  sampleCategories,
  sampleProperties,
  sampleTagTree,
} from "../test-utils/story-mocks";

const withMatch: ConditionTree = {
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
};

const meta = {
  title: "Components/AutofillRuleActivationSection",
  component: AutofillRuleActivationSection,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    defaultOpen: true,
    conditions: emptyConditionTree(),
    conditionsError: null,
    onChange: () => {},
    categories: sampleCategories,
    properties: sampleProperties,
    tagTree: sampleTagTree,
  },
} satisfies Meta<typeof AutofillRuleActivationSection>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Open, with an empty condition tree. */
export const Default: Story = {};

/** Collapsed, with a populated condition preview. */
export const CollapsedWithConditions: Story = {
  args: {
    defaultOpen: false,
    conditions: withMatch,
  },
};

/** An invalid condition tree surfaces an inline error. */
export const WithError: Story = {
  args: {
    conditions: withMatch,
    conditionsError: "A match condition needs a non-empty pattern.",
  },
};
