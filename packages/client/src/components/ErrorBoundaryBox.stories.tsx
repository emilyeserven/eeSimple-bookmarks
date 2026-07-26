import type { Meta, StoryObj } from "@storybook/react-vite";

import { ErrorBoundaryBox } from "./ErrorBoundaryBox";

/** A child that throws, to exercise the boundary's fallback. */
function Boom(): never {
  throw new Error("Render failed");
}

const meta = {
  title: "Components/ErrorBoundaryBox",
  component: ErrorBoundaryBox,
  args: {
    resetKey: "preview",
    fallback: (
      <p className="text-sm text-muted-foreground">Something went wrong rendering this section.</p>
    ),
    children: <p className="text-sm">A healthy child subtree renders normally.</p>,
  },
} satisfies Meta<typeof ErrorBoundaryBox>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Children render through untouched when nothing throws. */
export const Default: Story = {};

/** When a child throws, the boundary shows the fallback instead of unmounting the page. */
export const Failed: Story = {
  args: {
    children: <Boom />,
  },
};
