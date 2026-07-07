import type { Meta, StoryObj } from "@storybook/react-vite";

import { ImageProcessingSettingsCard } from "./ImageProcessingSettingsCard";

const meta = {
  title: "Settings/ImageProcessingSettingsCard",
  component: ImageProcessingSettingsCard,
} satisfies Meta<typeof ImageProcessingSettingsCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
