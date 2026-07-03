import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { AddGroupModal } from "./AddGroupModal";

import { Button } from "@/components/ui/button";

function Controlled() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
      >
        Open modal
      </Button>
      <AddGroupModal
        open={open}
        onOpenChange={setOpen}
        onCreated={() => undefined}
      />
    </>
  );
}

const meta = {
  title: "Components/AddGroupModal",
  component: AddGroupModal,
} satisfies Meta<typeof AddGroupModal>;

export default meta;

type Story = StoryObj;

/** Name-only inline create dialog — click "Open modal" to open it. */
export const Default: Story = {
  render: () => <Controlled />,
};
