import type { SectionDisplayValue } from "./SectionDisplaySettings";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { defaultCardZoneLayouts, emptyCardFieldZones } from "@eesimple/types";

import { SectionDisplaySettings } from "./SectionDisplaySettings";
import { makeCustomProperty } from "../test-utils/factories";

const properties = [
  makeCustomProperty({
    id: "prop-pages",
    name: "Pages",
    slug: "pages",
    type: "number",
    unitPlural: "pages",
  }),
];

const value: SectionDisplayValue = {
  viewMode: "cards",
  columns: 3,
  imageMode: "cover",
  imageVisibility: "shown",
  imageLayout: "above",
  fieldZones: emptyCardFieldZones(),
  cardZoneLayouts: defaultCardZoneLayouts(),
  hideWebsiteForYouTube: false,
  bookmarkLimit: null,
};

const meta = {
  title: "Components/SectionDisplaySettings",
  component: SectionDisplaySettings,
  args: {
    value,
    onChange: () => {},
    properties,
    idPrefix: "story",
  },
} satisfies Meta<typeof SectionDisplaySettings>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Per-section display controls: view mode, columns, image presentation, card-field zones, and layout. */
export const Default: Story = {};

/** Table view with images hidden and the YouTube website pill suppressed. */
export const TableNoImages: Story = {
  args: {
    value: {
      ...value,
      viewMode: "table",
      imageVisibility: "off",
      hideWebsiteForYouTube: true,
    },
  },
};
