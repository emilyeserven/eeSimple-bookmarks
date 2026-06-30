import type { Meta, StoryObj } from "@storybook/react-vite";

import { CategoryPreviewRow } from "./CategoryPreviewRow";
import { makeCategory } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/CategoryPreviewRow",
  component: CategoryPreviewRow,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  decorators: [Story => (
    <ul>
      <Story />
    </ul>
  )],
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
} satisfies Meta<typeof CategoryPreviewRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A built-in category row (with the Built-in badge). */
export const BuiltIn: Story = {
  args: {
    category: makeCategory({
      id: "default",
      name: "Default",
      slug: "default",
      builtIn: true,
      bookmarkCount: 14,
    }),
  },
};

/** An empty category (zero count → de-emphasized). */
export const Empty: Story = {
  args: {
    category: makeCategory({
      id: "drafts",
      name: "Drafts",
      slug: "drafts",
      bookmarkCount: 0,
    }),
  },
};
