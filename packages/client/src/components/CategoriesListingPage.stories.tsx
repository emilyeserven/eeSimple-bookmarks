import type { Meta, StoryObj } from "@storybook/react-vite";

import { CategoriesListingPage } from "./CategoriesListingPage";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/CategoriesListingPage",
  component: CategoriesListingPage,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof CategoriesListingPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
