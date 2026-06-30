import type { RuleDisplayValue } from "./CardDisplayRuleDisplaySettings";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { defaultCardZoneLayouts, emptyConditionTree } from "@eesimple/types";
import { HttpResponse, http } from "msw";

import { CardDisplayRulePreview } from "./CardDisplayRulePreview";
import { apiHandlers, sampleBookmark } from "../test-utils/story-mocks";

const concreteDisplay: RuleDisplayValue = {
  fieldZones: null,
  cardZoneLayouts: defaultCardZoneLayouts(),
  imageMode: "natural",
  imageVisibility: "shown",
  imageLayout: "above",
  hideWebsiteForYouTube: false,
};

const extraHandlers = [
  ...apiHandlers,
  http.get("/api/bookmarks", () => HttpResponse.json([sampleBookmark])),
  http.get("/api/card-display-rules", () => HttpResponse.json([])),
];

const meta = {
  title: "CardDisplayRules/CardDisplayRulePreview",
  component: CardDisplayRulePreview,
  parameters: {
    msw: {
      handlers: extraHandlers,
    },
  },
  args: {
    display: concreteDisplay,
    conditions: emptyConditionTree(),
    isDefault: false,
  },
} satisfies Meta<typeof CardDisplayRulePreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DefaultRule: Story = {
  args: {
    isDefault: true,
  },
};

export const ImageOnSide: Story = {
  args: {
    display: {
      ...concreteDisplay,
      imageLayout: "side",
    },
  },
};
