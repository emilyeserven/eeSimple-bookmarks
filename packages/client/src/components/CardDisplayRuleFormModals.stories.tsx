import type { Meta, StoryObj } from "@storybook/react-vite";

import { CardDisplayRuleFormModals } from "./CardDisplayRuleFormModals";

const placeholder = (label: string) => (
  <div className="rounded-md border p-4 text-sm">{label}</div>
);

const meta = {
  title: "CardDisplayRules/CardDisplayRuleFormModals",
  component: CardDisplayRuleFormModals,
  args: {
    isDefault: false,
    displayModalOpen: false,
    onDisplayOpenChange: () => {},
    ruleModalOpen: false,
    onRuleOpenChange: () => {},
    renderDisplay: () => placeholder("Display controls + preview"),
    generalFields: placeholder("Name + description inputs"),
    whenFields: placeholder("Condition tree editor"),
  },
} satisfies Meta<typeof CardDisplayRuleFormModals>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Both modals closed — nothing is shown. */
export const Closed: Story = {};

/** The Display settings modal opened. */
export const DisplayModalOpen: Story = {
  args: {
    displayModalOpen: true,
  },
};

/** The Rule settings (General + When) modal opened. */
export const RuleModalOpen: Story = {
  args: {
    ruleModalOpen: true,
  },
};
