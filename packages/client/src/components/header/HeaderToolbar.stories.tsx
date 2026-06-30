import type { ToolbarAction } from "./toolbarActions";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { PanelRight, Plus, SlidersHorizontal } from "lucide-react";

import { HeaderToolbar } from "./HeaderToolbar";

import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

const actions: ToolbarAction[] = [
  {
    key: "new",
    desktop: (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="New bookmark"
      >
        <Plus className="size-4" />
      </Button>
    ),
    mobile: {
      kind: "menuItem",
      node: (
        <DropdownMenuItem>
          <Plus className="size-4" />
          New bookmark
        </DropdownMenuItem>
      ),
    },
  },
  {
    key: "display",
    desktop: (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Display options"
      >
        <SlidersHorizontal className="size-4" />
      </Button>
    ),
    mobile: {
      kind: "modal",
      icon: SlidersHorizontal,
      label: "Display options",
      renderModal: () => null,
    },
  },
  {
    key: "panel",
    desktop: (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Toggle panel"
      >
        <PanelRight className="size-4" />
      </Button>
    ),
    mobile: {
      kind: "standalone",
    },
  },
];

const meta = {
  title: "Components/Header/HeaderToolbar",
  component: HeaderToolbar,
  args: {
    actions,
  },
  decorators: [Story => (
    <div className="flex w-full justify-end">
      <Story />
    </div>
  )],
} satisfies Meta<typeof HeaderToolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Wide-screen inline row: each action rendered with vertical dividers between them. */
export const Default: Story = {};

/** A single standalone action (the panel toggle). */
export const PanelToggleOnly: Story = {
  args: {
    actions: [actions[2]],
  },
};
