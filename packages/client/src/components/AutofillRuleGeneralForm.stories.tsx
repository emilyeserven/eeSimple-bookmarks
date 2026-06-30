import type { AutofillRule } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyConditionTree } from "@eesimple/types";

import { AutofillRuleGeneralForm } from "./AutofillRuleGeneralForm";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const rule: AutofillRule = {
  id: "rule-recipes",
  name: "Recipes",
  slug: "recipes",
  description: "Auto-tag recipe links from 101 Cookbooks.",
  conditions: emptyConditionTree(),
  setCategoryId: null,
  setMediaTypeId: null,
  tagIds: [],
  locationIds: [],
  numberValues: [],
  booleanValues: [],
  dateTimeValues: [],
  sortOrder: 3,
  createdAt: NOW,
};

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
