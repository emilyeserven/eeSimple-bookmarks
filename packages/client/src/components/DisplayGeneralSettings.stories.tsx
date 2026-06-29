import type { Meta, StoryObj } from "@storybook/react-vite";

import { DisplayGeneralSettings } from "./DisplayGeneralSettings";

const meta = {
  title: "Settings/DisplayGeneralSettings",
  component: DisplayGeneralSettings,
} satisfies Meta<typeof DisplayGeneralSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
