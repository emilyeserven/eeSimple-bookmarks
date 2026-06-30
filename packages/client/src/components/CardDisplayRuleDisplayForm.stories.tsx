import type { CardDisplayRule } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  defaultCardZoneLayouts,
  emptyCardFieldZones,
  emptyConditionTree,
} from "@eesimple/types";

import { CardDisplayRuleDisplayForm } from "./CardDisplayRuleDisplayForm";
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
  title: "Components/CardDisplayRuleDisplayForm",
  component: CardDisplayRuleDisplayForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    entity: makeRule(),
  },
} satisfies Meta<typeof CardDisplayRuleDisplayForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A non-default rule: every attribute inherits, with a live card preview alongside. */
export const Default: Story = {};

/** The Default rule: every attribute is concrete (no inherit option). */
export const DefaultRule: Story = {
  args: {
    entity: makeRule({
      id: "rule-default",
      name: "Default",
      slug: "default",
      isDefault: true,
      fieldZones: emptyCardFieldZones(),
      cardZoneLayouts: defaultCardZoneLayouts(),
      imageMode: "natural",
      imageVisibility: "shown",
      imageLayout: "above",
      hideWebsiteForYouTube: false,
    }),
  },
};
