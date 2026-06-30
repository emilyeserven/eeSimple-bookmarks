import type { Meta, StoryObj } from "@storybook/react-vite";

import { CategoryCard } from "./CategoryCard";
import { makeCategory } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/CategoryCard",
  component: CategoryCard,
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
    }),
    onDeleted: () => {},
  },
} satisfies Meta<typeof CategoryCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A built-in category — no Delete button, name field disabled. */
export const BuiltIn: Story = {
  args: {
    category: makeCategory({
      id: "default",
      name: "Default",
      slug: "default",
      description: "The category bookmarks use when none is chosen.",
      builtIn: true,
    }),
  },
};
