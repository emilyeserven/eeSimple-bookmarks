import type { Meta, StoryObj } from "@storybook/react-vite";

import { HeaderProgressIndicators } from "./HeaderProgressIndicators";

const meta = {
  title: "Components/Header/HeaderProgressIndicators",
  component: HeaderProgressIndicators,
} satisfies Meta<typeof HeaderProgressIndicators>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The inline image-capture + import progress indicators. Idle by default — each renders only while
 * its respective background job is in flight.
 */
export const Default: Story = {};
