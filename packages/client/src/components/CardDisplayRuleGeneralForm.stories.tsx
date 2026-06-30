import type { CardDisplayRule } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyConditionTree } from "@eesimple/types";

import { CardDisplayRuleGeneralForm } from "./CardDisplayRuleGeneralForm";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

function makeRule(overrides: Partial<CardDisplayRule> = {}): CardDisplayRule {
  return {
    id: "rule-videos",
    name: "Highlight videos",
    slug: "highlight-videos",
    description: "Bumps the image size for video bookmarks.",
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

const meta = {
  title: "CardDisplayRules/CardDisplayRuleGeneralForm",
  component: CardDisplayRuleGeneralForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    entity: makeRule(),
  },
} satisfies Meta<typeof CardDisplayRuleGeneralForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The Default rule: its name is fixed, only the description is editable. */
export const DefaultRule: Story = {
  args: {
    entity: makeRule({
      id: "rule-default",
      name: "Default",
      slug: "default",
      description: null,
      isDefault: true,
    }),
  },
};
