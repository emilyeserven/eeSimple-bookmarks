import type { CardDisplayRule } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyConditionTree } from "@eesimple/types";
import { HttpResponse, http } from "msw";

import { CardDisplayRuleForm } from "./CardDisplayRuleForm";
import { apiHandlers, sampleBookmark } from "../test-utils/story-mocks";

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

const extraHandlers = [
  ...apiHandlers,
  http.get("/api/bookmarks", () => HttpResponse.json([sampleBookmark])),
  http.get("/api/card-display-rules", () => HttpResponse.json([])),
  http.get("/api/card-field-templates", () => HttpResponse.json([])),
];

const meta = {
  title: "CardDisplayRules/CardDisplayRuleForm",
  component: CardDisplayRuleForm,
  parameters: {
    msw: {
      handlers: extraHandlers,
    },
  },
  args: {
    onCancel: () => {},
  },
} satisfies Meta<typeof CardDisplayRuleForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Create mode: explicit Save button, no existing rule. */
export const Create: Story = {
  args: {
    onSave: () => {},
  },
};

/** Edit mode: auto-save (a "Done" button instead of Save), editing an existing rule. */
export const Edit: Story = {
  args: {
    rule: makeRule(),
    onChange: () => {},
    onDelete: () => {},
  },
};

/** The Default (baseline) rule edits only its concrete display config. */
export const DefaultRule: Story = {
  args: {
    rule: makeRule({
      id: "rule-default",
      name: "Default",
      slug: "default",
      isDefault: true,
      imageMode: "natural",
      imageVisibility: "shown",
      imageLayout: "above",
      hideWebsiteForYouTube: false,
    }),
    onChange: () => {},
  },
};
