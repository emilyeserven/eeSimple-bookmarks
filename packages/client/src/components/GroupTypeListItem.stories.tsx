import type { Meta, StoryObj } from "@storybook/react-vite";

import { GroupTypeListItem } from "./GroupTypeListItem";
import { makeGroupType } from "../test-utils/factories";

const meta = {
  title: "Components/GroupTypeListItem",
  component: GroupTypeListItem,
  args: {
    groupType: makeGroupType({
      id: "gt-company",
      name: "Company",
      slug: "company",
      groupCount: 12,
    }),
  },
} satisfies Meta<typeof GroupTypeListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A user-created group type with member count and hover actions. */
export const Default: Story = {};

/** A seeded built-in group type — carries the Built-in badge. */
export const BuiltIn: Story = {
  args: {
    groupType: makeGroupType({
      id: "gt-band",
      name: "Band",
      slug: "band",
      builtIn: true,
      groupCount: 5,
    }),
  },
};

/** A hidden group type — carries the Hidden badge. */
export const Hidden: Story = {
  args: {
    groupType: makeGroupType({
      id: "gt-old",
      name: "Legacy",
      slug: "legacy",
      hidden: true,
      groupCount: 0,
    }),
  },
};

/** In selection mode with a checkbox shown. */
export const Selectable: Story = {
  args: {
    selectable: true,
    inSelectionMode: true,
    selected: true,
    onSelectToggle: () => {},
  },
};
