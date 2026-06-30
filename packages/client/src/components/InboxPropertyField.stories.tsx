import type { Meta, StoryObj } from "@storybook/react-vite";

import { InboxPropertyField } from "./InboxPropertyField";
import { makeCustomProperty } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const meta = {
  title: "Components/InboxPropertyField",
  component: InboxPropertyField,
  args: {
    preFill: {},
    setPreFill: () => {},
  },
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof InboxPropertyField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A boolean property renders as a checkbox + label. */
export const Boolean: Story = {
  args: {
    property: makeCustomProperty({
      id: "prop-reviewed",
      name: "Reviewed",
      slug: "reviewed",
      type: "boolean",
    }),
  },
};

/** A number property renders a numeric input. */
export const Number: Story = {
  args: {
    property: makeCustomProperty({
      id: "prop-priority",
      name: "Priority",
      slug: "priority",
      type: "number",
    }),
  },
};

/** A datetime property renders a date input. */
export const DateTime: Story = {
  args: {
    property: makeCustomProperty({
      id: "prop-due",
      name: "Due date",
      slug: "due-date",
      type: "datetime",
    }),
  },
};

/** A multi-select choices property renders a MultiCombobox. */
export const Choices: Story = {
  args: {
    property: makeCustomProperty({
      id: "prop-mood",
      name: "Mood",
      slug: "mood",
      type: "choices",
      choicesMultiple: true,
      choicesItems: [
        {
          value: "fun",
          label: "Fun",
        },
        {
          value: "serious",
          label: "Serious",
        },
      ],
    }),
  },
};
