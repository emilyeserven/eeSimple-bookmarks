import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkAutofillOffer } from "./BookmarkAutofillOffer";
import { apiHandlers, sampleCategories } from "../test-utils/story-mocks";

const meta = {
  title: "Components/BookmarkAutofillOffer",
  component: BookmarkAutofillOffer,
  args: {
    domain: "github.com",
    categoryId: "cat-workflow",
    categories: sampleCategories,
    dismissed: false,
    onDismiss: () => {},
  },
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof BookmarkAutofillOffer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dismissed: Story = {
  args: {
    dismissed: true,
  },
};

export const BuiltInCategoryHidden: Story = {
  args: {
    categoryId: "cat-default",
  },
};
