import type { AutofillRule } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { DebugView } from "./autofillDebugView";
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
  setMediaTypeId: null,
  tagIds: [],
  locationIds: [],
  numberValues: [],
  booleanValues: [],
  dateTimeValues: [],
  sortOrder: 3,
  createdAt: NOW,
};

const meta = {
  title: "Components/Workbench/AutofillDebugView",
  component: DebugView,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof DebugView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    entity: rule,
  },
};
