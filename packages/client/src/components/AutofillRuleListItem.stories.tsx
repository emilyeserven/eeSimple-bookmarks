import type { AutofillRule } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { AutofillRuleListItem } from "./AutofillRuleListItem";
import { apiHandlers, sampleCategories } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const rule: AutofillRule = {
  id: "rule-recipes",
  name: "Recipes from 101 Cookbooks",
  slug: "recipes",
  description: null,
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
  tagIds: [],
  locationIds: [],
  numberValues: [],
  booleanValues: [],
  dateTimeValues: [],
  sortOrder: 3,
  createdAt: NOW,
  matchCount: 12,
};

const meta = {
  title: "Components/AutofillRuleListItem",
  component: AutofillRuleListItem,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    rule,
    categories: sampleCategories,
  },
} satisfies Meta<typeof AutofillRuleListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A rule card with a target-category badge and a match count. */
export const Default: Story = {};

/** A rule that matches no existing bookmarks and sets no category. */
export const NoMatchesNoCategory: Story = {
  args: {
    rule: {
      ...rule,
      setCategoryId: null,
      matchCount: 0,
    },
  },
};

/** In selection mode, the card shows a checkbox. */
export const Selectable: Story = {
  args: {
    selectable: true,
    selected: true,
    inSelectionMode: true,
    onSelectToggle: () => {},
  },
};
