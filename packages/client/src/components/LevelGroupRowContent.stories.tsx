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
    renameGroup: noop,
    setGroupVisible: noop,
    setGroupDisplayMode: noop,
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

/** A hidden level set to render as pins, with no place types assigned yet. */
export const HiddenPinLevel: Story = {
  args: {
    group: {
      ...sampleGroup,
      id: "level-city",
      name: "City",
      placeTypes: [],
      displayMode: "pin",
      visible: false,
      color: null,
    },
  },
};
