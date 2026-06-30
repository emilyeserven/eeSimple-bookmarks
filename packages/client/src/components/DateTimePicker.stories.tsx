import type { Meta, StoryObj } from "@storybook/react-vite";

import { DateTimePicker, DateTimeRangeFields } from "./DateTimePicker";

const meta = {
  title: "Components/DateTimePicker",
  component: DateTimePicker,
  args: {
    format: "date",
    value: null,
    onChange: () => {},
  },
} satisfies Meta<typeof DateTimePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Date-only picker with no value selected. */
export const Date: Story = {};

/** Date-only picker with a value selected. */
export const WithValue: Story = {
  args: {
    value: "2026-06-30",
  },
};

/** A bare native time input. */
export const Time: Story = {
  args: {
    format: "time",
    value: "14:30",
  },
};

/** Combined date + time entry. */
export const DateAndTime: Story = {
  args: {
    format: "datetime",
    value: "2026-06-30T14:30",
  },
};

/** The labelled From/To range pair used by filters and condition editors. */
export const RangeFields: Story = {
  render: () => (
    <DateTimeRangeFields
      format="date"
      from="2026-06-01"
      to="2026-06-30"
      onChange={() => {}}
    />
  ),
};
