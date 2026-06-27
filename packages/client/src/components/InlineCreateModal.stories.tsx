import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { InlineCreateModal } from "./InlineCreateModal";

import { Button } from "@/components/ui/button";

function Controlled({
  isError = false, errorMessage,
}: { isError?: boolean;
  errorMessage?: string; }) {
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
      <InlineCreateModal
        open={open}
        onOpenChange={setOpen}
        title="New category"
        description="Give the category a name. You can edit the icon and settings afterward."
        placeholder="e.g. Workflow"
        submitLabel="Add category"
        pendingLabel="Adding…"
        isError={isError}
        errorMessage={errorMessage}
        onSubmit={(_name, done) => {
          setTimeout(done, 300);
        }}
      />
    </>
  );
}

const meta = {
  title: "Components/InlineCreateModal",
  component: InlineCreateModal,
} satisfies Meta<typeof InlineCreateModal>;

export default meta;

type Story = StoryObj;

/** Standard name-only create dialog — click "Open modal" to open it. */
export const Default: Story = {
  render: () => <Controlled />,
};

/** Error state — the create mutation failed and the error message is shown. */
export const WithError: Story = {
  render: () => (
    <Controlled
      isError
      errorMessage="A category with that name already exists."
    />
  ),
};
