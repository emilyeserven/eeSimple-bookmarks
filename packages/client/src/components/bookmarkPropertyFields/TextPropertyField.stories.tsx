import type { Meta, StoryObj } from "@storybook/react-vite";

import { TextPropertyField } from "./TextPropertyField";
import { makeCustomProperty } from "../../test-utils/factories";

const property = makeCustomProperty({
  id: "isbn",
  name: "ISBN",
  slug: "isbn",
  type: "text",
  description: "The 13-digit book identifier.",
});

const meta = {
  title: "Components/TextPropertyField",
  component: TextPropertyField,
  args: {
    property,
    fieldId: "property-isbn",
    value: "9780262033848",
    onChange: () => {},
  },
} satisfies Meta<typeof TextPropertyField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A plain text property with a value. */
export const Default: Story = {};

/** With an `onFetch` handler, a Sparkles fetch button appears next to the input. */
export const WithFetch: Story = {
  args: {
    onFetch: () => {},
  },
};

/** The fetch button shows a spinner while a fetch is pending. */
export const Fetching: Story = {
  args: {
    onFetch: () => {},
    isFetchPending: true,
  },
};
