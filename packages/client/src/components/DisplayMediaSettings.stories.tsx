import type { Meta, StoryObj } from "@storybook/react-vite";

import { DisplayMediaSettings } from "./DisplayMediaSettings";

const meta = {
  title: "Settings/DisplayMediaSettings",
  component: DisplayMediaSettings,
} satisfies Meta<typeof DisplayMediaSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
