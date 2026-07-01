import type { Meta, StoryObj } from "@storybook/react-vite";

import { LevelGroupEditRow } from "./LevelGroupEditRow";
import { makeStoryGroup, storyGroupRowProps, storySortableHandle } from "./levelGroupStoryFixtures";

const meta = {
  title: "Components/LevelGroupEditRow",
  component: LevelGroupEditRow,
  args: {
    group: makeStoryGroup(),
    ...storyGroupRowProps,
    ...storySortableHandle,
    onDone: () => {},
  },
} satisfies Meta<typeof LevelGroupEditRow>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The expanded editor: name, color, mode toggle, main-map checkbox, and place-type picker. */
export const Default: Story = {};

/** A group already carrying a place type that is also assigned elsewhere shows the duplicate warning. */
export const WithDuplicateWarning: Story = {
  args: {
    group: makeStoryGroup({
      placeTypes: ["country", "state"],
    }),
  },
};
