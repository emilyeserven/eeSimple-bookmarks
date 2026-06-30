import type { Meta, StoryObj } from "@storybook/react-vite";

import { CrumbLabel } from "./CrumbLabel";

const meta = {
  title: "Components/Header/CrumbLabel",
  component: CrumbLabel,
  args: {
    label: "Reading List",
  },
  decorators: [Story => (
    <div className="text-sm font-medium">
      <Story />
    </div>
  )],
} satisfies Meta<typeof CrumbLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A plain label with no romanized form. */
export const Default: Story = {};

/** A label with a romanized form stacked beneath it in muted text. */
export const WithRomanized: Story = {
  args: {
    label: "日本語",
    romanizedLabel: "Nihongo",
  },
};
