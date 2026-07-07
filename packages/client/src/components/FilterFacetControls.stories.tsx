import type { ComboboxOption } from "./Combobox";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { FacetChips, FacetPresenceToggle } from "./FilterFacetControls";

const meta = {
  title: "Filters/FilterFacetControls",
  component: FacetPresenceToggle,
  args: {
    value: undefined,
    onChange: () => {},
    hasLabel: "Has value",
    missingLabel: "No value",
  },
} satisfies Meta<typeof FacetPresenceToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Any / Has value / No value / Excludes selected — inactive options collapse until hover. */
export const PresenceToggle: Story = {};

/** With the "Has value" mode active. */
export const PresenceHasValue: Story = {
  args: {
    value: "has",
  },
};

/** Any / Exclude only — for a facet whose entity is never absent (e.g. Category). */
export const PresenceOnlyExclude: Story = {
  args: {
    onlyExclude: true,
    excludeLabel: "Excludes selected categories",
  },
};

const chipOptions: ComboboxOption[] = [
  {
    value: "site-github",
    label: "GitHub",
  },
  {
    value: "site-mdn",
    label: "MDN Web Docs",
  },
];

/** Selected options rendered as removable chips below a facet's combobox. */
export const Chips: StoryObj<typeof FacetChips> = {
  render: args => <FacetChips {...args} />,
  args: {
    options: chipOptions,
    values: ["site-github", "site-mdn"],
    onValuesChange: () => {},
  },
};
