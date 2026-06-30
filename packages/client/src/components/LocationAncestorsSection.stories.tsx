import type { LocationNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { LocationAncestorsSection } from "./LocationAncestorsSection";
import { makeLocation } from "../test-utils/factories";

const node: LocationNode = {
  ...makeLocation({
    id: "loc-hagi",
    name: "Hagi",
    slug: "hagi",
    placeType: "city",
    countryCode: "JP",
  }),
  children: [],
};

const existingOptions = [
  {
    value: "loc-japan",
    label: "Japan",
  },
  {
    value: "loc-yamaguchi",
    label: "Yamaguchi Prefecture",
  },
];

const meta = {
  title: "Components/LocationAncestorsSection",
  component: LocationAncestorsSection,
  args: {
    node,
    existingOptions,
  },
} satisfies Meta<typeof LocationAncestorsSection>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The edit-page ancestor-chain editor with an explicit "Save ancestors" button. */
export const Default: Story = {};
