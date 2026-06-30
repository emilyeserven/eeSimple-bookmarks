import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { AddPublisherModal } from "./AddPublisherModal";

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
      <AddPublisherModal
        open={open}
        onOpenChange={setOpen}
        onCreated={() => undefined}
      />
    </>
  );
}

const meta = {
  title: "Components/AddPublisherModal",
  component: AddPublisherModal,
} satisfies Meta<typeof AddPublisherModal>;

export default meta;

type Story = StoryObj;

/** Name-only inline create dialog — click "Open modal" to open it. */
export const Default: Story = {
  render: () => <Controlled />,
};
