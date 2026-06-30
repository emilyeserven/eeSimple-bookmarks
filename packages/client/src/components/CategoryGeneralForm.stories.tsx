import type { Meta, StoryObj } from "@storybook/react-vite";

import { CategoryGeneralForm } from "./CategoryGeneralForm";
import { makeCategory } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/CategoryGeneralForm",
  component: CategoryGeneralForm,
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
  },
} satisfies Meta<typeof CategoryGeneralForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A built-in category: the name field is disabled (renaming is blocked). */
export const BuiltIn: Story = {
  args: {
    category: makeCategory({
      id: "default",
      name: "Default",
      slug: "default",
      builtIn: true,
    }),
  },
};
