import type { Meta, StoryObj } from "@storybook/react-vite";

import { SidebarCategoryVisibilityList } from "./SidebarCategoryVisibilityList";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/SidebarCategoryVisibilityList",
  component: SidebarCategoryVisibilityList,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    hiddenCategoryIds: [],
    seeMoreCategoryIds: [],
    onSetMode: () => {},
  },
} satisfies Meta<typeof SidebarCategoryVisibilityList>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every category at its default visibility. */
export const Default: Story = {};

/** One category set to "See More" and another hidden from the sidebar. */
export const WithOverrides: Story = {
  args: {
    seeMoreCategoryIds: ["cat-workflow"],
    hiddenCategoryIds: ["cat-content"],
  },
};
