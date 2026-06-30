import type { Meta, StoryObj } from "@storybook/react-vite";

import { WebsiteBulkActions } from "./WebsiteBulkActions";
import { apiHandlers } from "../../test-utils/story-mocks";

const meta = {
  title: "Components/Bulk/WebsiteBulkActions",
  component: WebsiteBulkActions,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    selectedIds: ["w1", "w2", "w3"],
    onDone: () => {},
  },
  decorators: [Story => (
    <div className="flex flex-wrap items-center gap-2">
      <Story />
    </div>
  )],
} satisfies Meta<typeof WebsiteBulkActions>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The bulk-action trigger buttons for a multi-website selection (each opens its own dialog). */
export const Default: Story = {};
