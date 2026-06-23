import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { SelfIdsField } from "./SelfIdsField";

const meta = {
  title: "Components/SelfIdsField",
  component: SelfIdsField,
  args: {
    selfIds: ["SNL", "Weekend Update"],
    newSelfId: "",
    onNewSelfIdChange: () => {},
    onAdd: () => {},
    onRemove: () => {},
    description: "Short names this channel appends to video titles (e.g. “SNL”).",
  },
} satisfies Meta<typeof SelfIdsField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <Controlled initial={["SNL", "Weekend Update"]} />,
};

export const Empty: Story = {
  render: () => <Controlled initial={[]} />,
};

function Controlled({
  initial,
}: { initial: string[] }) {
  const [selfIds, setSelfIds] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");
  return (
    <div className="w-96">
      <SelfIdsField
        selfIds={selfIds}
        newSelfId={draft}
        onNewSelfIdChange={setDraft}
        onAdd={() => {
          const trimmed = draft.trim();
          if (trimmed && !selfIds.includes(trimmed)) setSelfIds([...selfIds, trimmed]);
          setDraft("");
        }}
        onRemove={id => setSelfIds(selfIds.filter(x => x !== id))}
        description="Short names this channel appends to video titles (e.g. “SNL”)."
      />
    </div>
  );
}
