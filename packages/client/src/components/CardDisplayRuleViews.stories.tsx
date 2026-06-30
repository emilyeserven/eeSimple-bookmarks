import type { CardDisplayRule } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyConditionTree } from "@eesimple/types";
import { HttpResponse, http } from "msw";

import {
  CardDisplayRuleConditionsView,
  CardDisplayRuleDisplayView,
  CardDisplayRuleGeneralView,
} from "./CardDisplayRuleViews";
import { apiHandlers, sampleBookmark } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

function makeRule(overrides: Partial<CardDisplayRule> = {}): CardDisplayRule {
  return {
    id: "rule-videos",
    name: "Highlight videos",
    slug: "highlight-videos",
    description: "Bumps the image size for video bookmarks.",
    conditions: {
      type: "group",
      combinator: "and",
      children: [
        {
          type: "media-type",
          mediaTypeIds: ["media-video"],
        },
      ],
    },
    sortOrder: 0,
    isDefault: false,
    fieldZones: null,
    cardZoneLayouts: null,
    imageMode: "natural",
    imageVisibility: "shown",
    imageLayout: "above",
    hideWebsiteForYouTube: null,
    createdAt: NOW,
    ...overrides,
  };
}

const extraHandlers = [
  ...apiHandlers,
  http.get("/api/bookmarks", () => HttpResponse.json([sampleBookmark])),
];

const meta = {
  title: "CardDisplayRules/CardDisplayRuleViews",
  component: CardDisplayRuleGeneralView,
  parameters: {
    msw: {
      handlers: extraHandlers,
    },
  },
} satisfies Meta<typeof CardDisplayRuleGeneralView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const General: Story = {
  args: {
    entity: makeRule(),
  },
};

export const GeneralNoDescription: Story = {
  args: {
    entity: makeRule({
      description: null,
    }),
  },
};

export const Conditions: StoryObj<typeof CardDisplayRuleConditionsView> = {
  render: args => <CardDisplayRuleConditionsView {...args} />,
  args: {
    entity: makeRule(),
  },
};

export const ConditionsDefaultRule: StoryObj<typeof CardDisplayRuleConditionsView> = {
  render: args => <CardDisplayRuleConditionsView {...args} />,
  args: {
    entity: makeRule({
      id: "rule-default",
      name: "Default",
      slug: "default",
      isDefault: true,
      conditions: emptyConditionTree(),
    }),
  },
};

export const Display: StoryObj<typeof CardDisplayRuleDisplayView> = {
  render: args => <CardDisplayRuleDisplayView {...args} />,
  args: {
    entity: makeRule(),
  },
};
