import type { Meta, StoryObj } from "@storybook/react-vite";

import { PanelTypeTiles } from "./PanelTypeTiles";

const meta = {
  title: "Components/Panel/PanelTypeTiles",
  component: PanelTypeTiles,
  render: () => (
    <div className="w-96">
      <PanelTypeTiles />
    </div>
  ),
} satisfies Meta<typeof PanelTypeTiles>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
