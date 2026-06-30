import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  BooleanFilterControl,
  ChoicesFilterControl,
  DateTimeFilterControl,
  NumberFilterControl,
} from "./CustomPropertyFilterControls";
import { makeCustomProperty } from "../test-utils/factories";

const numberProperty = makeCustomProperty({
  id: "prop-priority",
  name: "Priority",
  slug: "priority",
  type: "number",
  numberMin: 0,
  numberMax: 10,
});

const booleanProperty = makeCustomProperty({
  id: "prop-reviewed",
  name: "Reviewed",
  slug: "reviewed",
  type: "boolean",
});

const choicesProperty = makeCustomProperty({
  id: "prop-status",
  name: "Status",
  slug: "status",
  type: "choices",
  choicesItems: [
    {
      value: "todo",
      label: "To do",
    },
    {
      value: "doing",
      label: "In progress",
    },
    {
      value: "done",
      label: "Done",
    },
  ],
});

const dateTimeProperty = makeCustomProperty({
  id: "prop-due",
  name: "Due date",
  slug: "due-date",
  type: "datetime",
  dateTimeFormat: "date",
});

const meta = {
  title: "Components/CustomPropertyFilterControls",
  component: NumberFilterControl,
} satisfies Meta<typeof NumberFilterControl>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A range slider for a numeric property. */
export const Number: Story = {
  args: {
    property: numberProperty,
    bounds: [0, 10],
    value: undefined,
    onChange: () => {},
  },
};

/** A narrowed active range. */
export const NumberActiveRange: Story = {
  args: {
    property: numberProperty,
    bounds: [0, 10],
    value: [3, 7],
    onChange: () => {},
  },
};

/** A true/false combobox for a boolean property. */
export const Boolean: StoryObj = {
  render: () => (
    <BooleanFilterControl
      property={booleanProperty}
      value={undefined}
      onChange={() => {}}
    />
  ),
};

/** A multi-select for a choices property. */
export const Choices: StoryObj = {
  render: () => (
    <ChoicesFilterControl
      property={choicesProperty}
      value={["todo"]}
      onChange={() => {}}
    />
  ),
};

/** A From/To range for a date-time property. */
export const DateTime: StoryObj = {
  render: () => (
    <DateTimeFilterControl
      property={dateTimeProperty}
      value={undefined}
      onChange={() => {}}
    />
  ),
};
