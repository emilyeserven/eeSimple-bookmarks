import type { LocationCondition, LocationNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { http, HttpResponse } from "msw";

import { LocationConditionEditor } from "./LocationConditionEditor";
import { makeLocation } from "../../test-utils/factories";

const locationTree: LocationNode[] = [
  {
    ...makeLocation({
      id: "loc-japan",
      name: "Japan",
      slug: "japan",
    }),
    children: [
      {
        ...makeLocation({
          id: "loc-tokyo",
          name: "Tokyo",
          slug: "tokyo",
          parentId: "loc-japan",
        }),
        children: [],
      },
    ],
  },
  {
    ...makeLocation({
      id: "loc-usa",
      name: "United States",
      slug: "united-states",
    }),
    children: [],
  },
];

const locationHandlers = [
  http.get("/api/locations/tree", () => HttpResponse.json(locationTree)),
];

const meta = {
  title: "Components/Conditions/LocationConditionEditor",
  component: LocationConditionEditor,
  parameters: {
    msw: {
      handlers: locationHandlers,
    },
  },
  args: {
    value: {
      type: "location",
      locationIds: [],
    },
    onChange: () => {},
  },
  decorators: [Story => (
    <div className="w-80">
      <Story />
    </div>
  )],
} satisfies Meta<typeof LocationConditionEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  render: () => <Controlled initial={[]} />,
};

export const WithSelection: Story = {
  render: () => <Controlled initial={["loc-tokyo"]} />,
};

function Controlled({
  initial,
}: { initial: string[] }) {
  const [value, setValue] = useState<LocationCondition>({
    type: "location",
    locationIds: initial,
  });
  return (
    <LocationConditionEditor
      value={value}
      onChange={setValue}
    />
  );
}
