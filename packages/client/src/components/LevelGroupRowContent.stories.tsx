import type { PlaceTypeLevelGroup } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { LevelGroupRowContent } from "./LevelGroupRowContent";

const sampleGroup: PlaceTypeLevelGroup = {
  id: "level-country",
  name: "Country",
  placeTypes: ["country"],
  displayMode: "area",
  visible: true,
  sortOrder: 0,
  color: "#2563eb",
};

const sampleOptions = [
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
  title: "Components/LevelGroupRowContent",
  component: LevelGroupRowContent,
  args: {
    group: sampleGroup,
    options: sampleOptions,
    takenPlaceTypes: new Set<string>(),
    renameGroup: noop,
    setGroupVisible: noop,
    setGroupShowOnMainMap: noop,
    setGroupDisplayMode: noop,
    setGroupLevelMode: noop,
    setGroupPlaceTypes: noop,
    setGroupColor: noop,
    removeGroup: noop,
    attributes: {
      "role": "button",
      "tabIndex": 0,
      "aria-disabled": false,
      "aria-pressed": undefined,
      "aria-roledescription": "sortable",
      "aria-describedby": "DndDescribedBy-0",
    },
    listeners: {},
  },
} satisfies Meta<typeof LevelGroupRowContent>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A configured "Country" level rendering as an area, with one assigned place type. */
export const Default: Story = {};

/** A pin-mode level with no place types assigned yet, and region taken by another group. */
export const PinLevelWithTaken: Story = {
  args: {
    group: {
      ...sampleGroup,
      id: "level-city",
      name: "City",
      placeTypes: [],
      displayMode: "pin",
      color: null,
    },
    takenPlaceTypes: new Set(["region"]),
  },
};
