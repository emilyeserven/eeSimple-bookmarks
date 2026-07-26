import type { Meta, StoryObj } from "@storybook/react-vite";

import { ChoicesPropertyField } from "./ChoicesPropertyField";
import { makeCustomProperty } from "../../test-utils/factories";

const items = [
  {
    value: "want",
    label: "Want to read",
  },
  {
    value: "reading",
    label: "Reading",
  },
  {
    value: "done",
    label: "Finished",
  },
];

const meta = {
  title: "Components/ChoicesPropertyField",
  component: ChoicesPropertyField,
  args: {
    property: makeCustomProperty({
      id: "status",
      name: "Status",
      slug: "status",
      type: "choices",
      choicesItems: items,
      choicesDisplay: "radio",
      description: "Where you are with this.",
    }),
    selectedValues: ["reading"],
    onChange: () => {},
  },
} satisfies Meta<typeof ChoicesPropertyField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Radio display — single-select with a Clear option once something is chosen. */
export const Default: Story = {};

/** Dropdown display for a single-select choices property. */
export const Dropdown: Story = {
  args: {
    property: makeCustomProperty({
      id: "status",
      name: "Status",
      slug: "status",
      type: "choices",
      choicesItems: items,
      choicesDisplay: "dropdown",
      description: null,
    }),
    selectedValues: ["done"],
  },
};

/** Checkbox display for a multi-select choices property. */
export const MultiSelect: Story = {
  args: {
    property: makeCustomProperty({
      id: "tags",
      name: "Themes",
      slug: "themes",
      type: "choices",
      choicesItems: [
        {
          value: "scifi",
          label: "Sci-fi",
        },
        {
          value: "romance",
          label: "Romance",
        },
        {
          value: "mystery",
          label: "Mystery",
        },
      ],
      choicesDisplay: "checkbox",
      choicesMultiple: true,
      description: null,
    }),
    selectedValues: ["scifi", "mystery"],
  },
};
