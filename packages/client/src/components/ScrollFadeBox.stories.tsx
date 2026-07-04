import type { Meta, StoryObj } from "@storybook/react-vite";

import { ScrollFadeBox } from "./ScrollFadeBox";

import { Badge } from "@/components/ui/badge";

const meta = {
  title: "Components/ScrollFadeBox",
  component: ScrollFadeBox,
  args: {
    itemCount: 0,
    children: null,
  },
} satisfies Meta<typeof ScrollFadeBox>;

export default meta;

type Story = StoryObj<typeof meta>;

function badges(count: number) {
  return Array.from({
    length: count,
  }, (_, index) => (
    <li key={index}>
      <Badge variant="secondary">Item {index + 1}</Badge>
    </li>
  ));
}

/** A short list that fits within the box — no fade overlays appear. */
export const FewItems: Story = {
  render: () => (
    <div className="w-64">
      <ScrollFadeBox itemCount={3}>{badges(3)}</ScrollFadeBox>
    </div>
  ),
};

/** A long list that overflows — the bottom fade overlay hints there is more to scroll to. */
export const Overflowing: Story = {
  render: () => (
    <div className="w-64">
      <ScrollFadeBox itemCount={40}>{badges(40)}</ScrollFadeBox>
    </div>
  ),
};
