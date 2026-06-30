import type { LocationNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { RuleLocationsField } from "./RuleLocationsField";
import { makeLocation } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

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
];

const meta = {
  title: "Components/RuleLocationsField",
  component: RuleLocationsField,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    locationTree,
    selectedIds: [],
    onToggle: () => {},
  },
} satisfies Meta<typeof RuleLocationsField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Labelled location picker with nothing selected. */
export const Default: Story = {};

/** A location is pre-selected. */
export const WithSelection: Story = {
  args: {
    selectedIds: ["loc-tokyo"],
  },
};
