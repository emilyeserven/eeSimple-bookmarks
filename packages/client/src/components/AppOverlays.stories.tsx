import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppOverlays } from "./AppOverlays";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/AppOverlays",
  component: AppOverlays,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof AppOverlays>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The always-mounted app-chrome overlays (right panel, add-import modal, command palette), all
 * closed by default. */
export const Default: Story = {};
