import type { CardDisplayRule } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyConditionTree } from "@eesimple/types";
import { HttpResponse, http } from "msw";

import { CardDisplayRuleInspector } from "./CardDisplayRuleInspector";
import { apiHandlers, sampleBookmark } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const rules: CardDisplayRule[] = [
  {
    id: "rule-workflow",
    name: "Workflow cards",
    slug: "workflow-cards",
    description: null,
    conditions: {
      type: "group",
      combinator: "and",
      children: [
        {
          type: "category",
          categoryIds: ["cat-workflow"],
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
  },
  {
    id: "rule-default",
    name: "Default",
    slug: "default",
    description: null,
    conditions: emptyConditionTree(),
    sortOrder: 999,
    isDefault: true,
    fieldZones: null,
    cardZoneLayouts: null,
    imageMode: "natural",
    imageVisibility: "shown",
    imageLayout: "above",
    hideWebsiteForYouTube: false,
    createdAt: NOW,
  },
];

const extraHandlers = [
  ...apiHandlers,
  http.get("/api/bookmarks", () => HttpResponse.json([sampleBookmark])),
  http.get("/api/card-display-rules", () => HttpResponse.json(rules)),
  http.get("/api/custom-aspect-ratios", () => HttpResponse.json([])),
  http.get("/api/app-settings/display-preferences", () => HttpResponse.json({})),
];

const meta = {
  title: "CardDisplayRules/CardDisplayRuleInspector",
  component: CardDisplayRuleInspector,
  parameters: {
    msw: {
      handlers: extraHandlers,
    },
  },
} satisfies Meta<typeof CardDisplayRuleInspector>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
