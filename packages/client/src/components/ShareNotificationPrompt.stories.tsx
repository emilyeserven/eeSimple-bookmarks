import type { Meta, StoryObj } from "@storybook/react-vite";

import { ShareNotificationPrompt } from "./ShareNotificationPrompt";

const meta = {
  title: "Components/ShareNotificationPrompt",
  component: ShareNotificationPrompt,
} satisfies Meta<typeof ShareNotificationPrompt>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Dismissible banner asking for notification permission so shared links can be saved without
 * opening the app. Renders nothing if notifications are unsupported, already decided, or dismissed.
 */
export const Default: Story = {};
