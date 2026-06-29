import type { Meta, StoryObj } from "@storybook/react-vite";

import { DisplaySidebarSettings } from "./DisplaySidebarSettings";

const meta = {
  title: "Settings/DisplaySidebarSettings",
  component: DisplaySidebarSettings,
} satisfies Meta<typeof DisplaySidebarSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
