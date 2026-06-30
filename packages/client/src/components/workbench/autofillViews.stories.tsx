import type { AutofillRule } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { ConditionsView } from "./autofillViews";
import { makeLocation } from "../../test-utils/factories";
import { apiHandlers } from "../../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const rule: AutofillRule = {
  id: "rule-recipes",
  name: "Recipes",
  slug: "recipes",
  description: "Auto-tag recipe links from 101 Cookbooks.",
  conditions: {
    type: "group",
    combinator: "and",
    children: [
      {
        type: "match",
        field: "url",
        operator: "domain",
        pattern: "101cookbooks.com",
      },
      {
        type: "category",
        categoryIds: ["cat-workflow"],
      },
    ],
  },
  setCategoryId: "cat-workflow",
  setMediaTypeId: "media-article",
  tagIds: ["tag-cli"],
  locationIds: ["loc-sf"],
  numberValues: [
    {
      propertyId: "prop-priority",
      value: 8,
    },
  ],
  booleanValues: [],
  dateTimeValues: [],
  sortOrder: 3,
  createdAt: NOW,
};

const handlers = [
  http.get("/api/locations", () => HttpResponse.json([makeLocation({
    id: "loc-sf",
    name: "San Francisco",
    slug: "san-francisco",
  })])),
  ...apiHandlers,
];

const meta = {
  title: "Workbench/AutofillConditionsView",
  component: ConditionsView,
  parameters: {
    msw: {
      handlers,
    },
  },
  args: {
    entity: rule,
  },
} satisfies Meta<typeof ConditionsView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The Conditions view tab for an autofill rule. */
export const Default: Story = {};

/** A rule whose match tree is a single domain condition. */
export const SingleCondition: Story = {
  args: {
    entity: {
      ...rule,
      conditions: {
        type: "group",
        combinator: "and",
        children: [
          {
            type: "match",
            field: "url",
            operator: "domain",
            pattern: "example.com",
          },
        ],
      },
    },
  },
};
