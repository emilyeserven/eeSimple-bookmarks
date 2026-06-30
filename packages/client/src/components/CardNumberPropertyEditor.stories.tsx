import type { Meta, StoryObj } from "@storybook/react-vite";

import { CardNumberPropertyEditor } from "./CardNumberPropertyEditor";
import { makeCustomProperty } from "../test-utils/factories";

const property = makeCustomProperty({
  id: "pages",
  name: "Pages read",
  slug: "pages-read",
  type: "number",
  unitPlural: "pages",
});

const meta = {
  title: "Components/CardNumberPropertyEditor",
  component: CardNumberPropertyEditor,
  render: args => (
    <div className="w-56 rounded-md border">
      <CardNumberPropertyEditor {...args} />
    </div>
  ),
  args: {
    property,
    inputId: "card-number-editor",
    current: 120,
    onCommit: () => {},
  },
} satisfies Meta<typeof CardNumberPropertyEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Editing a property that already has a value. */
export const Default: Story = {};

/** No value set yet — the input starts empty. */
export const Unset: Story = {
  args: {
    current: undefined,
  },
};

/** A property without a unit label. */
export const NoUnit: Story = {
  args: {
    property: makeCustomProperty({
      id: "score",
      name: "Score",
      slug: "score",
      type: "number",
    }),
    current: 42,
  },
};
