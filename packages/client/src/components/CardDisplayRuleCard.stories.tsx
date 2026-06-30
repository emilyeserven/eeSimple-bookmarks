import type { CardDisplayRule } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyConditionTree } from "@eesimple/types";

import { CardDisplayRuleCard } from "./CardDisplayRuleCard";
import { apiHandlers } from "../test-utils/story-mocks";

function makeRule(overrides: Partial<CardDisplayRule> = {}): CardDisplayRule {
  return {
    id: "rule-1",
    name: "YouTube cards",
    slug: "youtube-cards",
    description: null,
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
  title: "Components/CardDisplayRuleCard",
  component: CardDisplayRuleCard,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  decorators: [
    Story => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
  args: {
    rule: makeRule(),
  },
} satisfies Meta<typeof CardDisplayRuleCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A normal rule row with a drag handle, condition summary, and Edit/Info/Delete controls. */
export const Default: Story = {};

/** The pinned, non-deletable Default rule (lock icon, "baseline" tag, no conditions). */
export const DefaultRule: Story = {
  args: {
    rule: makeRule({
      id: "rule-default",
      name: "Default",
      slug: "default",
      isDefault: true,
      conditions: emptyConditionTree(),
    }),
  },
};

/** A rule being dragged (elevated shadow). */
export const Dragging: Story = {
  args: {
    rule: makeRule(),
    isDragging: true,
  },
};
