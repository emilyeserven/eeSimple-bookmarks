import type { AncestorDraft } from "./locationFormSchema";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { LocationAncestorChainEditor } from "./LocationAncestorChainEditor";
import { emptyAncestorDraft } from "./locationFormSchema";

const existingOptions = [
  {
    value: "loc-japan",
    label: "Japan",
  },
  {
    value: "loc-yamaguchi",
    label: "Yamaguchi Prefecture",
  },
];

function Controlled({
  initial = [],
}: { initial?: AncestorDraft[] }) {
  const [value, setValue] = useState<AncestorDraft[]>(initial);
  return (
    <div className="max-w-xl">
      <LocationAncestorChainEditor
        value={value}
        onChange={setValue}
        existingOptions={existingOptions}
      />
    </div>
  );
}

const meta = {
  title: "Components/LocationAncestorChainEditor",
  component: LocationAncestorChainEditor,
} satisfies Meta<typeof LocationAncestorChainEditor>;

export default meta;

type Story = StoryObj;

/** Empty chain — just the description and the "Add ancestor" button. */
export const Default: Story = {
  render: () => <Controlled />,
};

/** One new (named) ancestor row ready to edit or look up. */
export const WithNewAncestor: Story = {
  render: () => (
    <Controlled
      initial={[
        {
          ...emptyAncestorDraft(),
          name: "Yamaguchi Prefecture",
        },
      ]}
    />
  ),
};

/** A single existing-location row, which caps the chain (no "Add ancestor" button). */
export const CappedByExisting: Story = {
  render: () => (
    <Controlled
      initial={[
        {
          ...emptyAncestorDraft(),
          existingId: "loc-japan",
        },
      ]}
    />
  ),
};
