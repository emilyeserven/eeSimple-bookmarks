import type { Meta, StoryObj } from "@storybook/react-vite";

import { CardDisplayRuleGeneralFields } from "./CardDisplayRuleGeneralFields";

const meta = {
  title: "CardDisplayRules/CardDisplayRuleGeneralFields",
  component: CardDisplayRuleGeneralFields,
  args: {
    idPrefix: "rule-1",
    name: "Highlight unread videos",
    description: "Applies to video bookmarks that haven't been watched yet.",
    onNameChange: () => {},
    onDescriptionChange: () => {},
  },
} satisfies Meta<typeof CardDisplayRuleGeneralFields>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    name: "",
    description: null,
  },
};
