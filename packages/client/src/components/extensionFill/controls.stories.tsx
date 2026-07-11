import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { KindSelect } from "./controls";

const meta = {
  title: "Components/ExtensionFill/KindSelect",
  component: KindSelect,
  args: {
    label: "Target kind",
    value: "field",
    options: [{
      value: "field",
      label: "Field",
    }],
    onValueChange: () => {},
  },
} satisfies Meta<typeof KindSelect<string>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState("field");
    return (
      <div className="w-64">
        <KindSelect
          label="Target kind"
          value={value}
          options={[
            {
              value: "field",
              label: "Field",
            },
            {
              value: "customProperty",
              label: "Custom property",
            },
            {
              value: "taxonomy",
              label: "Taxonomy",
            },
          ]}
          onValueChange={setValue}
        />
      </div>
    );
  },
};

export const WithDescriptions: Story = {
  render: () => {
    const [value, setValue] = useState("url");
    return (
      <div className="w-72">
        <KindSelect
          label="Resolve from"
          value={value}
          options={[
            {
              value: "url",
              label: "URL",
              description: "Resolve the entity from the page URL.",
            },
            {
              value: "match",
              label: "Match",
              description: "Resolve by matching extracted text.",
            },
          ]}
          onValueChange={setValue}
        />
      </div>
    );
  },
};
