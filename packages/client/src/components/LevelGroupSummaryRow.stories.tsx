import type { Meta, StoryObj } from "@storybook/react-vite";

import { makeStoryGroup, storyGroupRowProps, storySortableHandle } from "./levelGroupStoryFixtures";
import { LevelGroupSummaryRow } from "./LevelGroupSummaryRow";

const meta = {
  title: "Components/LevelGroupSummaryRow",
  component: LevelGroupSummaryRow,
  args: {
    group: makeStoryGroup(),
    ...storyGroupRowProps,
    ...storySortableHandle,
    onEdit: () => {},
  },
} satisfies Meta<typeof LevelGroupSummaryRow>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A named group shown on the main map with a couple of place types. */
export const Default: Story = {};

/** A pin-mode group hidden from the main map, with no place types assigned. */
export const PinModeNoPlaceTypes: Story = {
  args: {
    group: makeStoryGroup({
      name: "City",
      displayMode: "pin",
      showOnMainMap: false,
      placeTypes: [],
    }),
  },
};

/** A place type also assigned to another level renders as a removable warning chip. */
export const WithDuplicatePlaceType: Story = {
  args: {
    group: makeStoryGroup({
      placeTypes: ["country", "state"],
    }),
  },
};

/** A level excluded from every map's default shown levels — "above"/"below" and the main map. */
export const HiddenByDefault: Story = {
  args: {
    group: makeStoryGroup({
      name: "Country",
      visible: false,
    }),
  },
};
