import type { GroupRowProps } from "./levelGroupRowTypes";
import type { PlaceTypeLevelGroup } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { DndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { SortableGroupRow } from "./SortableLevelGroupRow";

const GROUP: PlaceTypeLevelGroup = {
  id: "group-country",
  name: "Country",
  placeTypes: ["country"],
  displayMode: "area",
  visible: true,
  sortOrder: 0,
  color: "#2563eb",
};

const OPTIONS: GroupRowProps["options"] = [
  {
    key: "country",
    label: "Country",
  },
  {
    key: "region",
    label: "Region",
  },
  {
    key: "city",
    label: "City",
  },
];

const noop = () => {};

const meta = {
  title: "Components/SortableLevelGroupRow",
  component: SortableGroupRow,
  decorators: [
    Story => (
      <DndContext>
        <SortableContext
          items={[GROUP.id]}
          strategy={verticalListSortingStrategy}
        >
          <div className="w-md">
            <Story />
          </div>
        </SortableContext>
      </DndContext>
    ),
  ],
  args: {
    group: GROUP,
    options: OPTIONS,
    takenPlaceTypes: new Set<string>(),
    renameGroup: noop,
    setGroupShowOnMainMap: noop,
    setGroupDisplayMode: noop,
    setGroupPlaceTypes: noop,
    setGroupColor: noop,
    removeGroup: noop,
  },
} satisfies Meta<typeof SortableGroupRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A pin-mode group with city taken by another group. */
export const PinGroupWithTaken: Story = {
  args: {
    group: {
      ...GROUP,
      id: "group-city",
      name: "City",
      placeTypes: ["city"],
      displayMode: "pin",
      color: null,
    },
    takenPlaceTypes: new Set(["country"]),
  },
};
