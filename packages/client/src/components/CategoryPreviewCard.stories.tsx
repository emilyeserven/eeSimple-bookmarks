import type { Meta, StoryObj } from "@storybook/react-vite";

import { CategoryPreviewCard } from "./CategoryPreviewCard";
import { makeCategory } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/CategoryPreviewCard",
  component: CategoryPreviewCard,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    category: makeCategory({
      id: "articles",
      name: "Articles",
      slug: "articles",
      description: "Long-form reading saved for later.",
      icon: "Newspaper",
      bookmarkCount: 42,
    }),
  },
} satisfies Meta<typeof CategoryPreviewCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The `full` standalone view-page body. */
export const Full: Story = {};

/** A built-in category in the full view. */
export const BuiltIn: Story = {
  args: {
    category: makeCategory({
      id: "default",
      name: "Default",
      slug: "default",
      description: "The category bookmarks use when none is chosen.",
      builtIn: true,
      isHomepage: true,
      bookmarkCount: 14,
    }),
  },
};

/** The `row` listing variant. */
export const Row: Story = {
  decorators: [Story => (
    <ul>
      <Story />
    </ul>
  )],
  args: {
    variant: "row",
  },
};
