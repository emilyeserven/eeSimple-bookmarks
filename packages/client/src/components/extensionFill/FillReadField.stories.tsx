import type { FillExtract } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { FillReadField } from "./FillReadField";

const meta = {
  title: "Components/ExtensionFill/FillReadField",
  component: FillReadField,
  args: {
    read: {
      kind: "text",
    },
    onChange: () => {},
  },
} satisfies Meta<typeof FillReadField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TextContent: Story = {
  render: () => {
    const [read, setRead] = useState<FillExtract["read"]>({
      kind: "text",
    });
    return (
      <div className="w-72">
        <FillReadField
          read={read}
          onChange={setRead}
        />
      </div>
    );
  },
};

export const Attribute: Story = {
  render: () => {
    const [read, setRead] = useState<FillExtract["read"]>({
      kind: "attr",
      name: "href",
    });
    return (
      <div className="w-72">
        <FillReadField
          read={read}
          onChange={setRead}
        />
      </div>
    );
  },
};
