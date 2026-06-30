import type { Meta, StoryObj } from "@storybook/react-vite";

import { PanelList } from "./PanelList";
import { apiHandlers } from "../../test-utils/story-mocks";

const meta = {
  title: "Components/Panel/PanelList",
  component: PanelList,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  render: args => (
    <div className="w-96">
      <PanelList {...args} />
    </div>
  ),
} satisfies Meta<typeof PanelList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Categories: Story = {
  args: {
    type: "category",
  },
};

export const Bookmarks: Story = {
  args: {
    type: "bookmark",
  },
};
