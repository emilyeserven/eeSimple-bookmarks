import type { Meta, StoryObj } from "@storybook/react-vite";

import { DateTimePropertyField } from "./DateTimePropertyField";
import { makeCustomProperty } from "../../test-utils/factories";

const property = makeCustomProperty({
  id: "published",
  name: "Date published",
  slug: "date-published",
  type: "datetime",
  dateTimeFormat: "date",
  description: "When this was first released.",
});

const meta = {
  title: "Components/DateTimePropertyField",
  component: DateTimePropertyField,
  args: {
    property,
    fieldId: "property-published",
    value: "2026-01-15",
    onChange: () => {},
  },
} satisfies Meta<typeof DateTimePropertyField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A date property with a picked value. */
export const Default: Story = {};

/** An empty (unset) date field. */
export const Empty: Story = {
  args: {
    value: null,
  },
};
