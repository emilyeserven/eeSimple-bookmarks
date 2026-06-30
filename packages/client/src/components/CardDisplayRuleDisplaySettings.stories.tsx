import type { RuleDisplayValue } from "./CardDisplayRuleDisplaySettings";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { defaultCardZoneLayouts } from "@eesimple/types";
import { HttpResponse, http } from "msw";

import { CardDisplayRuleDisplaySettings } from "./CardDisplayRuleDisplaySettings";
import { defaultCardFieldZones } from "../lib/bookmarkCardValues";
import { apiHandlers, sampleProperties } from "../test-utils/story-mocks";

const inheritValue: RuleDisplayValue = {
  fieldZones: null,
  cardZoneLayouts: null,
  imageMode: null,
  imageVisibility: null,
  imageLayout: null,
  hideWebsiteForYouTube: null,
};

const concreteValue: RuleDisplayValue = {
  fieldZones: defaultCardFieldZones(sampleProperties),
  cardZoneLayouts: defaultCardZoneLayouts(),
  imageMode: "natural",
  imageVisibility: "shown",
  imageLayout: "above",
  hideWebsiteForYouTube: false,
};

const extraHandlers = [
  ...apiHandlers,
  http.get("/api/card-field-templates", () => HttpResponse.json([])),
];

const meta = {
  title: "CardDisplayRules/CardDisplayRuleDisplaySettings",
  component: CardDisplayRuleDisplaySettings,
  parameters: {
    msw: {
      handlers: extraHandlers,
    },
  },
  args: {
    properties: sampleProperties,
    idPrefix: "rule-1",
    onChange: () => {},
  },
} satisfies Meta<typeof CardDisplayRuleDisplaySettings>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A non-default rule with every attribute inheriting from lower-priority rules. */
export const Inheriting: Story = {
  args: {
    value: inheritValue,
  },
};

/** A non-default rule overriding every attribute with a concrete value. */
export const Overriding: Story = {
  args: {
    value: concreteValue,
  },
};

/** The Default (baseline) rule: every attribute is concrete, no Inherit/Override toggles. */
export const DefaultRule: Story = {
  args: {
    value: concreteValue,
    isDefault: true,
  },
};
