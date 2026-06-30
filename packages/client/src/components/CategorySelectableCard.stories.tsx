import type { Meta, StoryObj } from "@storybook/react-vite";

import { CategorySelectableCard } from "./CategorySelectableCard";
import { makeCategory } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/CategorySelectableCard",
  component: CategorySelectableCard,
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
    selected: false,
    inSelectionMode: false,
    onSelectToggle: () => {},
  },
} satisfies Meta<typeof CategorySelectableCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Selection mode on but not yet selected — the whole card is a select target. */
export const SelectionMode: Story = {
  args: {
    inSelectionMode: true,
  },
};

/** Selected in selection mode — a primary ring highlights the card. */
export const Selected: Story = {
  args: {
    inSelectionMode: true,
    selected: true,
  },
};
