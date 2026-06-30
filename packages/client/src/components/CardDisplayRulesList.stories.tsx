import type { CardDisplayRule } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { CardDisplayRulesList } from "./CardDisplayRulesList";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const rules: CardDisplayRule[] = [
  {
    id: "rule-workflow",
    name: "Workflow cards",
    slug: "workflow-cards",
    description: "Compact cards for workflow bookmarks.",
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
    imageMode: null,
    imageVisibility: null,
    imageLayout: null,
    hideWebsiteForYouTube: null,
    createdAt: NOW,
  },
];

const withRules = [
  ...apiHandlers,
  http.get("/api/card-display-rules", () => HttpResponse.json(rules)),
];

const noRules = [
  ...apiHandlers,
  http.get("/api/card-display-rules", () => HttpResponse.json([])),
];

const meta = {
  title: "CardDisplayRules/CardDisplayRulesList",
  component: CardDisplayRulesList,
  parameters: {
    msw: {
      handlers: withRules,
    },
  },
} satisfies Meta<typeof CardDisplayRulesList>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Scoped to a category that one rule references. */
export const ScopedToCategory: Story = {
  args: {
    categoryId: "cat-workflow",
  },
};

/** Scoped to a category with no matching rules. */
export const Empty: Story = {
  args: {
    categoryId: "cat-content",
  },
  parameters: {
    msw: {
      handlers: noRules,
    },
  },
};
