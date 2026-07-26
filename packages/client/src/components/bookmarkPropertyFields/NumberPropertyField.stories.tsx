import type { Meta, StoryObj } from "@storybook/react-vite";

import { NumberPropertyField } from "./NumberPropertyField";
import { makeCustomProperty } from "../../test-utils/factories";

const property = makeCustomProperty({
  id: "pages",
  name: "Pages",
  slug: "pages",
  type: "number",
  description: "Total page count.",
});

const meta = {
  title: "Components/NumberPropertyField",
  component: NumberPropertyField,
  args: {
    property,
    fieldId: "property-pages",
    value: "384",
    onChange: () => {},
  },
} satisfies Meta<typeof NumberPropertyField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A number property with a value and description. */
export const Default: Story = {};

/** A plural unit is appended to the label (e.g. "Runtime (minutes)"). */
export const WithUnit: Story = {
  args: {
    property: makeCustomProperty({
      id: "runtime",
      name: "Runtime",
      slug: "runtime",
      type: "number",
      unitSingular: "minute",
      unitPlural: "minutes",
      description: null,
    }),
    fieldId: "property-runtime",
    value: "142",
  },
};
