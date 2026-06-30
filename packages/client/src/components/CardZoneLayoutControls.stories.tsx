import type { Meta, StoryObj } from "@storybook/react-vite";

import { defaultCardZoneLayouts } from "@eesimple/types";

import { CardZoneLayoutControls } from "./CardZoneLayoutControls";

const meta = {
  title: "Components/CardZoneLayoutControls",
  component: CardZoneLayoutControls,
  args: {
    value: defaultCardZoneLayouts(),
    onChange: () => {},
  },
} satisfies Meta<typeof CardZoneLayoutControls>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The default per-zone layout (every body zone flows inline). */
export const Default: Story = {};

/** A zone switched to grid mode, with custom gap and alignment. */
export const Customized: Story = {
  args: {
    value: {
      ...defaultCardZoneLayouts(),
      "card-labels": {
        mode: "grid",
        gap: "lg",
        align: "between",
        alignItems: "center",
      },
      "card-single-top": {
        mode: "flex",
        direction: "column",
        wrap: "nowrap",
      },
    },
  },
};
