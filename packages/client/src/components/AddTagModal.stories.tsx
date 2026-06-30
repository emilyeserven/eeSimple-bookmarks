import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { AddTagModal } from "./AddTagModal";
import { apiHandlers } from "../test-utils/story-mocks";

import { Button } from "@/components/ui/button";

function Controlled({
  showParent = true, defaultParentId = null,
}: { showParent?: boolean;
  defaultParentId?: string | null; }) {
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
      <AddTagModal
        open={open}
        onOpenChange={setOpen}
        showParent={showParent}
        defaultParentId={defaultParentId}
        onCreated={() => undefined}
      />
    </>
  );
}

const meta = {
  title: "Components/AddTagModal",
  component: AddTagModal,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof AddTagModal>;

export default meta;

type Story = StoryObj;

/** Root/subtag create dialog with the parent select shown. */
export const Default: Story = {
  render: () => <Controlled />,
};

/** Header quick-add variant — the parent is fixed and the parent select is hidden. */
export const SubTag: Story = {
  render: () => (
    <Controlled
      showParent={false}
      defaultParentId="tag-dev"
    />
  ),
};
