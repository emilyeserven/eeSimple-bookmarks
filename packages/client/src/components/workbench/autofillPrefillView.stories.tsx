import type { AutofillRule } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { PrefillView } from "./autofillPrefillView";
import { apiHandlers } from "../../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const rule: AutofillRule = {
  id: "rule-recipes",
  name: "Recipes",
  slug: "recipes",
  description: "Auto-tag recipe links.",
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
    ],
  },
  setCategoryId: "cat-workflow",
  setMediaTypeId: "media-article",
  tagIds: [],
  locationIds: [],
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

const meta = {
  title: "Components/Workbench/AutofillPrefillView",
  component: PrefillView,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof PrefillView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    entity: rule,
  },
};

export const NothingSet: Story = {
  args: {
    entity: {
      ...rule,
      setCategoryId: null,
      setMediaTypeId: null,
      numberValues: [],
    },
  },
};
