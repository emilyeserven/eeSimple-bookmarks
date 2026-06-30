import type { Meta, StoryObj } from "@storybook/react-vite";

import { FacetSelect } from "./AutofillRulesFilterBar";

const meta = {
  title: "Components/AutofillRulesFilterBar/FacetSelect",
  component: FacetSelect,
  args: {
    label: "websites",
    value: undefined,
    options: [
      {
        value: "github",
        label: "GitHub",
      },
      {
        value: "youtube",
        label: "YouTube",
      },
    ],
    onChange: () => {},
  },
} satisfies Meta<typeof FacetSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    value: "github",
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};
