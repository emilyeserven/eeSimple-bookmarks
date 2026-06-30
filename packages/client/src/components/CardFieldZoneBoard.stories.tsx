import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyCardFieldZones } from "@eesimple/types";

import { CardFieldZoneBoard } from "./CardFieldZoneBoard";
import { makeCustomProperty } from "../test-utils/factories";

const properties = [
  makeCustomProperty({
    id: "rating",
    name: "Rating",
    slug: "rating",
    type: "boolean",
    booleanLabelPreset: "stars",
  }),
  makeCustomProperty({
    id: "pages",
    name: "Pages",
    slug: "pages",
    type: "number",
    unitPlural: "pages",
  }),
];

function emptyZones() {
  return emptyCardFieldZones();
}

function placedZones() {
  const zones = emptyCardFieldZones();
  zones["card-labels"] = [{
    key: "tags",
  }, {
    key: "category",
  }];
  zones["card-table"] = [{
    key: "pages",
  }];
  zones["image-top-left"] = [{
    key: "mediaType",
    scale: 1.5,
    mobileScale: null,
  }];
  return zones;
}

const meta = {
  title: "Components/CardFieldZoneBoard",
  component: CardFieldZoneBoard,
  args: {
    value: emptyZones(),
    properties,
    idPrefix: "story",
    onChange: () => {},
  },
} satisfies Meta<typeof CardFieldZoneBoard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Nothing placed yet — every field sits in the "Available (hidden)" tray. */
export const Default: Story = {};

/** Fields spread across body sub-zones and an image corner. */
export const WithPlacements: Story = {
  args: {
    value: placedZones(),
  },
};
