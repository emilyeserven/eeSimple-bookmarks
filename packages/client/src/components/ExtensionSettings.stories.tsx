import type { Meta, StoryObj } from "@storybook/react-vite";

import { ExtensionSettings } from "./ExtensionSettings";

const meta = {
  title: "Settings/ExtensionSettings",
  component: ExtensionSettings,
} satisfies Meta<typeof ExtensionSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
