import type { Meta, StoryObj } from "@storybook/react-vite";

import { CategoryDefaultsSection } from "./CategoryDefaultsSection";
import { makeCategory } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/CategoryDefaultsSection",
  component: CategoryDefaultsSection,
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
    }),
  },
} satisfies Meta<typeof CategoryDefaultsSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
