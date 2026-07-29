import type { Meta, StoryObj } from "@storybook/react-vite";

import { ParamRulesList } from "./ParamRulesList";

const meta = {
  title: "Components/ParamRulesList",
  component: ParamRulesList,
  args: {
    emptyText: "None configured.",
    rules: [
      {
        pathSuffix: "/watch",
        params: ["v", "t"],
      },
      {
        pathSuffix: "",
        params: [],
      },
    ],
  },
} satisfies Meta<typeof ParamRulesList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** No rules configured, showing the empty text. */
export const Empty: Story = {
  args: {
    rules: [],
  },
};
