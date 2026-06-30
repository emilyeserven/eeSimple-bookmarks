import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  ColumnsSelect,
  OnOffToggleGroup,
  ViewModeToggle,
} from "./DisplayControlPrimitives";

const meta = {
  title: "Components/DisplayControlPrimitives",
  component: ViewModeToggle,
  args: {
    value: "cards",
    onChange: () => {},
  },
} satisfies Meta<typeof ViewModeToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The cards/table view toggle. */
export const ViewMode: Story = {};

/** Table view selected. */
export const ViewModeTable: Story = {
  args: {
    value: "table",
  },
};

/** The grid column-count selector. */
export const Columns: StoryObj<typeof ColumnsSelect> = {
  render: args => <ColumnsSelect {...args} />,
  args: {
    value: 3,
    onChange: () => {},
  },
};

/** The shared On/Off two-state toggle body. */
export const OnOff: StoryObj<typeof OnOffToggleGroup> = {
  render: args => <OnOffToggleGroup {...args} />,
  args: {
    value: true,
    onChange: () => {},
  },
};
