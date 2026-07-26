import type { Meta, StoryObj } from "@storybook/react-vite";

import { BooleanPropertyField } from "./BooleanPropertyField";
import { makeCustomProperty } from "../../test-utils/factories";

const property = makeCustomProperty({
  id: "read",
  name: "Read",
  slug: "read",
  type: "boolean",
  description: "Have you finished this yet?",
});

const meta = {
  title: "Components/BooleanPropertyField",
  component: BooleanPropertyField,
  args: {
    property,
    fieldId: "property-read",
    checked: false,
    onChange: () => {},
  },
} satisfies Meta<typeof BooleanPropertyField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** An unchecked boolean property with its description line. */
export const Default: Story = {};

/** The checked state. */
export const Checked: Story = {
  args: {
    checked: true,
  },
};

/** Without a description, only the checkbox + label show. */
export const NoDescription: Story = {
  args: {
    property: makeCustomProperty({
      id: "read",
      name: "Read",
      slug: "read",
      type: "boolean",
      description: null,
    }),
  },
};
