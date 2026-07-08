import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { Star } from "lucide-react";

import { SegmentedToggleRow } from "./SegmentedToggleRow";

const PLACEMENT_OPTIONS = [
  {
    value: "default",
    label: "Default",
  },
  {
    value: "advanced",
    label: "Advanced",
  },
  {
    value: "hidden",
    label: "Hidden",
  },
] as const;

const meta = {
  title: "Components/SegmentedToggleRow",
  component: SegmentedToggleRow,
  args: {
    label: "Category",
    options: PLACEMENT_OPTIONS,
    value: "default",
    onChange: () => {},
  },
} satisfies Meta<typeof SegmentedToggleRow<string>>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Three-state placement row, the pattern used by the Bookmark Add Form settings. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("default");
    return (
      <div className="w-96">
        <SegmentedToggleRow
          label="Category"
          options={PLACEMENT_OPTIONS}
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};

/** With a leading icon and a muted hint line under the label. */
export const WithIconAndHint: Story = {
  render: () => {
    const [value, setValue] = useState("advanced");
    return (
      <div className="w-96">
        <SegmentedToggleRow
          label="Rating"
          icon={<Star className="size-4" />}
          hint="Locked to a matching media type"
          options={PLACEMENT_OPTIONS}
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};

/** A two-option (on/off) row — the minimum the joined-segment styling supports. */
export const TwoOptions: Story = {
  render: () => {
    const [value, setValue] = useState("show");
    return (
      <div className="w-96">
        <SegmentedToggleRow
          label="Website pill"
          options={[
            {
              value: "show",
              label: "Show",
            },
            {
              value: "hide",
              label: "Hide",
            },
          ]}
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};
