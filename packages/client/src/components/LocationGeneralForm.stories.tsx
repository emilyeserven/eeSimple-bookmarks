import type { LocationNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { LocationGeneralForm } from "./LocationGeneralForm";
import { makeLocation } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const node: LocationNode = {
  ...makeLocation({
    id: "loc-hagi",
    name: "Hagi",
    slug: "hagi",
    latitude: 34.4081,
    longitude: 131.3989,
    placeType: "city",
    countryCode: "JP",
  }),
  children: [],
};

const handlers = [
  ...apiHandlers,
  http.get("/api/locations", () => HttpResponse.json([node])),
  http.get("/api/locations/tree", () => HttpResponse.json([node])),
];

const meta = {
  title: "Components/LocationGeneralForm",
  component: LocationGeneralForm,
  args: {
    node,
  },
  parameters: {
    msw: {
      handlers,
    },
  },
} satisfies Meta<typeof LocationGeneralForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The per-field auto-saving edit form for a location, prefilled from the node. */
export const Default: Story = {};
