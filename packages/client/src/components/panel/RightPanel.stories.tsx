import type { Meta, StoryObj } from "@storybook/react-vite";

import { RightPanel } from "./RightPanel";
import { apiHandlers } from "../../test-utils/story-mocks";

/**
 * The shared right-hand panel is URL-driven (`dOpen`/`dCT`/`dCId`). With no drawer search params it
 * stays closed, so this story documents the mounted-but-closed state; opening it is exercised by the
 * panel-controls flows in the app.
 */
const meta = {
  title: "Components/Panel/RightPanel",
  component: RightPanel,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof RightPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
