import type { RuleInspection } from "../lib/cardDisplayRules";
import type { CardDisplayRule } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyConditionTree } from "@eesimple/types";

import { CardRuleInspectorMatches } from "./CardRuleInspectorMatches";

function makeRule(overrides: Partial<CardDisplayRule> = {}): CardDisplayRule {
  return {
    id: "rule",
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
    createdAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

const labels = {
  aspectLabel: new Map<string, string>([["16:9", "16 : 9"]]),
  fieldLabel: new Map<string, string>([["tags", "Tags"]]),
};

const matchedRules: RuleInspection[] = [
  {
    rule: makeRule({
      id: "videos",
      name: "Videos",
    }),
    matched: true,
    attrs: [
      {
        key: "imageVisibility",
        label: "Image",
        value: "shown",
        status: "applied",
        overriddenBy: null,
      },
      {
        key: "imageMode",
        label: "Image mode",
        value: "cropped",
        status: "overridden",
        overriddenBy: "default",
      },
    ],
  },
  {
    rule: makeRule({
      id: "default",
      name: "Default",
      isDefault: true,
      sortOrder: 999,
    }),
    matched: true,
    attrs: [],
  },
];

const unmatchedRules: RuleInspection[] = [
  {
    rule: makeRule({
      id: "books",
      name: "Books",
    }),
    matched: false,
    attrs: [],
  },
  {
    rule: makeRule({
      id: "podcasts",
      name: "Podcasts",
    }),
    matched: false,
    attrs: [],
  },
];

const ruleNameById = new Map<string, string>([
  ["default", "Default"],
  ["videos", "Videos"],
]);

const meta = {
  title: "Components/CardRuleInspectorMatches",
  component: CardRuleInspectorMatches,
  args: {
    matchedRules,
    unmatchedRules,
    ruleNameById,
    labels,
  },
} satisfies Meta<typeof CardRuleInspectorMatches>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Matched rules with applied and overridden attributes, plus a collapsed list of non-applying rules. */
export const Default: Story = {};

/** No rules fail to apply — the collapsible "don't apply" list is omitted. */
export const AllApply: Story = {
  args: {
    unmatchedRules: [],
  },
};

/** A single matched rule that sets no display attributes. */
export const NoAttributes: Story = {
  args: {
    matchedRules: [
      {
        rule: makeRule({
          id: "default",
          name: "Default",
          isDefault: true,
        }),
        matched: true,
        attrs: [],
      },
    ],
    unmatchedRules: [],
  },
};
