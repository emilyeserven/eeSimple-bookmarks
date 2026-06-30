import type { InboxPreFillDefaults } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { InboxPreFillBox } from "./InboxPreFillBox";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/InboxPreFillBox",
  component: InboxPreFillBox,
  args: {
    preFill: {},
    setPreFill: () => {},
    onReset: () => {},
  },
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof InboxPreFillBox>;

export default meta;

type Story = StoryObj<typeof meta>;

/** An empty pre-fill box — every default is unset and "Reset all" is disabled. */
export const Default: Story = {};

/** A pre-fill with a chosen category — "Reset all" becomes enabled. */
export const WithDefaults: Story = {
  args: {
    preFill: {
      categoryId: "cat-workflow",
      tagIds: ["tag-react"],
    } satisfies InboxPreFillDefaults,
  },
};
