import type { Meta, StoryObj } from "@storybook/react-vite";

import { BulkSetPropertyButton } from "./BulkSetPropertyButton";
import { apiHandlers, sampleProperties } from "../../test-utils/story-mocks";

const meta = {
  title: "Components/BulkSetPropertyButton",
  component: BulkSetPropertyButton,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    ids: ["bm-1", "bm-2"],
    properties: sampleProperties,
    onDone: () => {},
  },
} satisfies Meta<typeof BulkSetPropertyButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The "Set property" trigger — opens a dialog to set one settable (number/boolean/date) property across the selection. */
export const Default: Story = {};
