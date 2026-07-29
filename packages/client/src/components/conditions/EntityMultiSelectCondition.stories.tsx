import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { EntityMultiSelectCondition } from "./EntityMultiSelectCondition";

const options = [
  {
    value: "article",
    label: "Article",
  },
  {
    value: "video",
    label: "Video",
  },
  {
    value: "podcast",
    label: "Podcast",
  },
  {
    value: "book",
    label: "Book",
  },
];

const meta = {
  title: "Components/Conditions/EntityMultiSelectCondition",
  component: EntityMultiSelectCondition,
  args: {
    ariaLabel: "Media Types",
    placeholder: "Select media types",
    searchPlaceholder: "Search media types…",
    emptyText: "No media types found.",
    options,
    values: [],
    onValuesChange: () => {},
  },
} satisfies Meta<typeof EntityMultiSelectCondition>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The generic multi-select condition with no values chosen. */
export const Empty: Story = {
  render: args => (
    <Controlled
      {...args}
      initial={[]}
    />
  ),
};

/** Two options preselected (Article and Video). */
export const WithSelection: Story = {
  render: args => (
    <Controlled
      {...args}
      initial={["article", "video"]}
    />
  ),
};

function Controlled({
  initial,
  ...args
}: React.ComponentProps<typeof EntityMultiSelectCondition> & { initial: string[] }) {
  const [values, setValues] = useState<string[]>(initial);
  return (
    <div className="w-80">
      <EntityMultiSelectCondition
        {...args}
        values={values}
        onValuesChange={setValues}
      />
    </div>
  );
}
