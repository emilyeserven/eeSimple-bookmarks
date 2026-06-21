import type { Meta, StoryObj } from "@storybook/react-vite";

import { ImageAspectRatiosCard } from "./ImageAspectRatiosCard";

const meta = {
  title: "Settings/ImageAspectRatiosCard",
  component: ImageAspectRatiosCard,
} satisfies Meta<typeof ImageAspectRatiosCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
