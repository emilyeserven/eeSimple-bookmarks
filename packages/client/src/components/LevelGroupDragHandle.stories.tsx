import type { Meta, StoryObj } from "@storybook/react-vite";

import { LevelGroupDragHandle } from "./LevelGroupDragHandle";
import { storySortableHandle } from "./levelGroupStoryFixtures";

const meta = {
  title: "Components/LevelGroupDragHandle",
  component: LevelGroupDragHandle,
  args: {
    label: "Region",
    ...storySortableHandle,
  },
} satisfies Meta<typeof LevelGroupDragHandle>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The grip button used to reorder a level group; its aria-label includes the level name. */
export const Default: Story = {};
