import type { LocationLookupResult } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { LocationLookupBox } from "./LocationLookupBox";

const sampleResult: LocationLookupResult = {
  results: [
    {
      name: "萩市",
      romanizedName: "Hagi",
      displayName: "Hagi, Yamaguchi Prefecture, Japan",
      latitude: 34.4081,
      longitude: 131.3989,
      mapUrl: "https://maps.google.com/?q=34.4081,131.3989",
      placeType: "city",
      countryCode: "JP",
      boundary: null,
      ancestors: [],
      wikidataId: null,
    },
  ],
};

const handlers = [
  http.get("/api/locations/lookup", () => HttpResponse.json(sampleResult)),
];

const meta = {
  title: "Components/LocationLookupBox",
  component: LocationLookupBox,
  args: {
    onSelect: () => {},
  },
  parameters: {
    msw: {
      handlers,
    },
  },
} satisfies Meta<typeof LocationLookupBox>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The geocoder search box; typing a query and searching lists candidate places to pick. */
export const Default: Story = {};
