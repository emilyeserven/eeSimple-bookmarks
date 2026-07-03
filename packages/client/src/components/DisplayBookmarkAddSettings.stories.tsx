import type { Meta, StoryObj } from "@storybook/react-vite";

import { DisplayBookmarkAddSettings } from "./DisplayBookmarkAddSettings";

const meta = {
  title: "Settings/DisplayBookmarkAddSettings",
  component: DisplayBookmarkAddSettings,
} satisfies Meta<typeof DisplayBookmarkAddSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
