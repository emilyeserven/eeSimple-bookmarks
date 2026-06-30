import type { CardDisplayRule } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyConditionTree } from "@eesimple/types";

import { CardDisplayRuleSortableList } from "./CardDisplayRuleSortableList";

const NOW = "2026-06-01T00:00:00.000Z";

function makeRule(overrides: Partial<CardDisplayRule>): CardDisplayRule {
  return {
    id: "rule-1",
    name: "Rule",
    slug: "rule",
    description: null,
    conditions: emptyConditionTree(),
    sortOrder: 0,
    isDefault: false,
    fieldZones: null,
    cardZoneLayouts: null,
    imageMode: null,
    imageVisibility: null,
    imageLayout: null,
    hideWebsiteForYouTube: null,
    createdAt: NOW,
    ...overrides,
  };
}

const rules: CardDisplayRule[] = [
  makeRule({
    id: "rule-videos",
    name: "Highlight videos",
    slug: "highlight-videos",
    sortOrder: 0,
  }),
  makeRule({
    id: "rule-unread",
    name: "Dim read items",
    slug: "dim-read-items",
    sortOrder: 1,
  }),
  makeRule({
    id: "rule-default",
    name: "Default",
    slug: "default",
    isDefault: true,
    sortOrder: 999,
  }),
];

const meta = {
  title: "CardDisplayRules/CardDisplayRuleSortableList",
  component: CardDisplayRuleSortableList,
} satisfies Meta<typeof CardDisplayRuleSortableList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    serverRules: rules,
    isLoading: false,
  },
};

export const Empty: Story = {
  args: {
    serverRules: [rules[2]],
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    serverRules: undefined,
    isLoading: true,
  },
};
