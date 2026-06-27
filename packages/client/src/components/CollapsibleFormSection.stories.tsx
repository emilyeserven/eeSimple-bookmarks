import type { Meta, StoryObj } from "@storybook/react-vite";

import { CollapsibleFormSection } from "./CollapsibleFormSection";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const meta = {
  title: "Components/CollapsibleFormSection",
  component: CollapsibleFormSection,
  args: {
    title: "Activation conditions",
    description: "The rule only runs when all conditions are met. Leave empty to always run.",
    preview: "3 conditions",
    children: (
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Input
            placeholder="Any category"
            readOnly
          />
        </div>
        <div className="space-y-1.5">
          <Label>Media type</Label>
          <Input
            placeholder="Any media type"
            readOnly
          />
        </div>
      </div>
    ),
  },
} satisfies Meta<typeof CollapsibleFormSection>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Collapsed by default — the preview text is visible under the title. */
export const Collapsed: Story = {};

/** Open by default — the full fields are visible. */
export const Open: Story = {
  args: {
    defaultOpen: true,
  },
};

/** A preview that is a React node instead of a plain string. */
export const NodePreview: Story = {
  args: {
    preview: <span className="text-muted-foreground italic">No conditions set</span>,
  },
};
