import type { LocationAlternateName } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { AlternateNamesEditor } from "./AlternateNamesEditor";

function Controlled({
  initial = [],
}: { initial?: LocationAlternateName[] }) {
  const [value, setValue] = useState<LocationAlternateName[]>(initial);
  return (
    <div className="max-w-xl">
      <AlternateNamesEditor
        value={value}
        onChange={setValue}
      />
    </div>
  );
}

const meta = {
  title: "Components/AlternateNamesEditor",
  component: AlternateNamesEditor,
} satisfies Meta<typeof AlternateNamesEditor>;

export default meta;

type Story = StoryObj;

/** Empty editor — shows the "No alternate names yet" hint and the add button. */
export const Default: Story = {
  render: () => <Controlled />,
};

/** Pre-populated with a couple of romanization styles. */
export const WithNames: Story = {
  render: () => (
    <Controlled
      initial={[
        {
          value: "Tōkyō",
          style: "Hepburn",
        },
        {
          value: "Tokyo",
          style: null,
        },
      ]}
    />
  ),
};
