import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { ChoicesCheckboxList } from "./ChoicesCheckboxList";

import { makeCustomProperty } from "@/test-utils/factories";

const property = makeCustomProperty({
  id: "colors",
  name: "Colors",
  type: "choices",
  description: "Pick every color that applies.",
  choicesItems: [
    {
      label: "Red",
      value: "red",
    },
    {
      label: "Green",
      value: "green",
    },
    {
      label: "Blue",
      value: "blue",
    },
  ],
});

function Controlled({
  initial = [],
}: { initial?: string[] }) {
  const [values, setValues] = useState(initial);
  return (
    <ChoicesCheckboxList
      property={property}
      fieldId="story"
      selectedValues={values}
      onChange={setValues}
    />
  );
}

const meta = {
  title: "Components/ChoicesCheckboxList",
  component: ChoicesCheckboxList,
} satisfies Meta<typeof ChoicesCheckboxList>;

export default meta;

type Story = StoryObj;

/** Nothing selected yet. */
export const Empty: Story = {
  render: () => <Controlled />,
};

/** Some options pre-selected. */
export const WithSelection: Story = {
  render: () => <Controlled initial={["green", "blue"]} />,
};
