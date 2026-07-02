import type { Meta, StoryObj } from "@storybook/react-vite";

import { HeaderProgressIndicators } from "./HeaderProgressIndicators";

const meta = {
  title: "Components/Header/HeaderProgressIndicators",
  component: HeaderProgressIndicators,
} satisfies Meta<typeof HeaderProgressIndicators>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The consolidated header "Background activity" indicator (imports + reel archiving + image
 * auto-fetch + channel-avatar backfill). Idle by default — it renders only while at least one
 * background job is in flight.
 */
export const Default: Story = {};
