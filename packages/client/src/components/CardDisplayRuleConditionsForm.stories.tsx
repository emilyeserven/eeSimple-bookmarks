import type { CardDisplayRule } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyConditionTree } from "@eesimple/types";

import { CardDisplayRuleConditionsForm } from "./CardDisplayRuleConditionsForm";
import { apiHandlers } from "../test-utils/story-mocks";

function makeRule(overrides: Partial<CardDisplayRule> = {}): CardDisplayRule {
  return {
    id: "rule-1",
    name: "YouTube cards",
    slug: "youtube-cards",
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
    createdAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

const meta = {
  title: "Components/CardDisplayRuleConditionsForm",
  component: CardDisplayRuleConditionsForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    entity: makeRule(),
  },
} satisfies Meta<typeof CardDisplayRuleConditionsForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** An empty condition tree (matches every card) with the preview section beneath. */
export const Default: Story = {};

/** Conditions limiting the rule to one website. */
export const WithWebsiteCondition: Story = {
  args: {
    entity: makeRule({
      conditions: {
        type: "group",
        combinator: "and",
        children: [
          {
            type: "website",
            domains: ["youtube.com"],
          },
        ],
      },
    }),
  },
};
