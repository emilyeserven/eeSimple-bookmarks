import type { Meta, StoryObj } from "@storybook/react-vite";

import { DebugView } from "./autofillDebugView";
import { makeAutofillRule } from "../../test-utils/factories";
import { apiHandlers } from "../../test-utils/story-mocks";

const rule = makeAutofillRule({
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
  sortOrder: 3,
});

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
