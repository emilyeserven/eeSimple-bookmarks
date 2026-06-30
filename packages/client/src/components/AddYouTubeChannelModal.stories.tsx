import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { AddYouTubeChannelModal } from "./AddYouTubeChannelModal";

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
      <AddYouTubeChannelModal
        open={open}
        onOpenChange={setOpen}
        onCreated={() => undefined}
      />
    </>
  );
}

const meta = {
  title: "Components/AddYouTubeChannelModal",
  component: AddYouTubeChannelModal,
} satisfies Meta<typeof AddYouTubeChannelModal>;

export default meta;

type Story = StoryObj;

/** Manual "add a YouTube channel by hand" dialog with channel URL + name. */
export const Default: Story = {
  render: () => <Controlled />,
};
