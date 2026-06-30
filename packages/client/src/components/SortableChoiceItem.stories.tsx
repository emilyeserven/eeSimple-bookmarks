import type { ChoicesItem } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { SortableChoiceItem } from "./SortableChoiceItem";

const ITEMS: ChoicesItem[] = [
  {
    label: "To do",
    value: "to-do",
  },
  {
    label: "In progress",
    value: "in-progress",
    isDefault: true,
  },
  {
    label: "Done",
    value: "done",
  },
];

const meta = {
  title: "Components/SortableChoiceItem",
  component: SortableChoiceItem,
  decorators: [
    Story => (
      <DndContext>
        <SortableContext
          items={ITEMS.map(item => item.value)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="w-96 space-y-2">
            <Story />
          </ul>
        </SortableContext>
      </DndContext>
    ),
  ],
  args: {
    item: ITEMS[0],
    index: 0,
    idPrefix: "status",
    onLabelChange: () => {},
    onLabelBlur: () => {},
    onDefaultChange: () => {},
    onRemove: () => {},
  },
} satisfies Meta<typeof SortableChoiceItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The item currently marked as the form default (its radio is checked). */
export const IsDefault: Story = {
  args: {
    item: ITEMS[1],
    index: 1,
  },
};
