import type { Meta, StoryObj } from "@storybook/react-vite";

import { InboxPreFillModals } from "./InboxPreFillModals";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/InboxPreFillModals",
  component: InboxPreFillModals,
  args: {
    preFill: {},
    setPreFill: () => {},
    addCategoryOpen: false,
    setAddCategoryOpen: () => {},
    addMediaTypeOpen: false,
    setAddMediaTypeOpen: () => {},
    addPublisherOpen: false,
    setAddPublisherOpen: () => {},
    addAuthorOpen: false,
    setAddAuthorOpen: () => {},
  },
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof InboxPreFillModals>;

export default meta;

type Story = StoryObj<typeof meta>;

/** All four modals closed — nothing is rendered. */
export const Default: Story = {};

/** The "Add category" modal opened from the pre-fill box. */
export const CategoryOpen: Story = {
  args: {
    addCategoryOpen: true,
  },
};

/** The "Add author" modal opened from the pre-fill box. */
export const AuthorOpen: Story = {
  args: {
    addAuthorOpen: true,
  },
};
