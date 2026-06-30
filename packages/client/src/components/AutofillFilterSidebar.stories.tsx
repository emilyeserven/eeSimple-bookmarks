import type { Meta, StoryObj } from "@storybook/react-vite";

import { AutofillFilterSidebar } from "./AutofillFilterSidebar";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/AutofillFilterSidebar",
  component: AutofillFilterSidebar,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    search: {},
    onChange: () => {},
  },
} satisfies Meta<typeof AutofillFilterSidebar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The filter rail with no facets active. */
export const Default: Story = {};

/** A search query and a category facet are active, so the "Clear filters" button shows. */
export const WithActiveFilters: Story = {
  args: {
    search: {
      q: "recipe",
      category: "workflow",
    },
  },
};
