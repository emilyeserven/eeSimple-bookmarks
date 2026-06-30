import type { CardDisplayRule } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyConditionTree } from "@eesimple/types";
import { HttpResponse, http } from "msw";

import { CardDisplayRulesSettings } from "./CardDisplayRulesSettings";
import { apiHandlers, sampleBookmark } from "../test-utils/story-mocks";

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
    id: "rule-default",
    name: "Default",
    slug: "default",
    isDefault: true,
    sortOrder: 999,
    imageMode: "natural",
    imageVisibility: "shown",
    imageLayout: "above",
    hideWebsiteForYouTube: false,
  }),
];

const baseExtra = [
  http.get("/api/bookmarks", () => HttpResponse.json([sampleBookmark])),
  http.get("/api/custom-aspect-ratios", () => HttpResponse.json([])),
  http.get("/api/app-settings/display-preferences", () => HttpResponse.json({})),
];

const withRules = [
  ...apiHandlers,
  ...baseExtra,
  http.get("/api/card-display-rules", () => HttpResponse.json(rules)),
];

const noRules = [
  ...apiHandlers,
  ...baseExtra,
  http.get("/api/card-display-rules", () => HttpResponse.json([rules[1]])),
];

const meta = {
  title: "Settings/CardDisplayRulesSettings",
  component: CardDisplayRulesSettings,
  parameters: {
    msw: {
      handlers: withRules,
    },
  },
} satisfies Meta<typeof CardDisplayRulesSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Only the pinned Default rule, no custom rules yet. */
export const OnlyDefault: Story = {
  parameters: {
    msw: {
      handlers: noRules,
    },
  },
};
