import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { AddWebsiteModal } from "./AddWebsiteModal";

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
      <AddWebsiteModal
        open={open}
        onOpenChange={setOpen}
        onCreated={() => undefined}
      />
    </>
  );
}

const meta = {
  title: "Components/AddWebsiteModal",
  component: AddWebsiteModal,
} satisfies Meta<typeof AddWebsiteModal>;

export default meta;

type Story = StoryObj;

/** Manual "add a website by hand" dialog with domain + optional site name. */
export const Default: Story = {
  render: () => <Controlled />,
};
