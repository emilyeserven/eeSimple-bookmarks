import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { RowShell } from "./RowShell";

const KIND_OPTIONS = [
  {
    value: "selfText",
    label: "Self text",
  },
  {
    value: "siblingText",
    label: "Sibling text",
  },
  {
    value: "closest",
    label: "Closest selector",
  },
];

const meta = {
  title: "Components/ExtensionFill/RowShell",
  component: RowShell,
  args: {
    kindLabel: "Filter",
    kind: "selfText",
    kindOptions: KIND_OPTIONS,
    onKindChange: () => {},
    index: 0,
    count: 3,
    onMove: () => {},
    onRemove: () => {},
  },
} satisfies Meta<typeof RowShell<string>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FirstRow: Story = {
  render: () => {
    const [kind, setKind] = useState("selfText");
    return (
      <div className="w-96">
        <RowShell
          kindLabel="Filter"
          kind={kind}
          kindOptions={KIND_OPTIONS}
          onKindChange={setKind}
          index={0}
          count={3}
          onMove={() => {}}
          onRemove={() => {}}
        >
          <p className="text-sm text-muted-foreground">Variant-specific fields render here.</p>
        </RowShell>
      </div>
    );
  },
};

export const MiddleRow: Story = {
  render: () => {
    const [kind, setKind] = useState("closest");
    return (
      <div className="w-96">
        <RowShell
          kindLabel="Transform"
          kind={kind}
          kindOptions={KIND_OPTIONS}
          onKindChange={setKind}
          index={1}
          count={3}
          onMove={() => {}}
          onRemove={() => {}}
        >
          <p className="text-sm text-muted-foreground">Move up/down both enabled here.</p>
        </RowShell>
      </div>
    );
  },
};
