import type { BookmarkLocation } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkLocationsBox } from "./BookmarkLocationsBox";
import { apiHandlers } from "../test-utils/story-mocks";

const locations: BookmarkLocation[] = [
  {
    id: "loc-tokyo",
    name: "Tokyo",
    slug: "tokyo",
    parentId: null,
    placeType: null,
  },
  {
    id: "loc-kyoto",
    name: "Kyoto",
    slug: "kyoto",
    parentId: null,
    placeType: null,
  },
  {
    id: "loc-osaka",
    name: "Osaka",
    slug: "osaka",
    parentId: null,
    placeType: null,
  },
];

const meta = {
  title: "Bookmarks/BookmarkLocationsBox",
  component: BookmarkLocationsBox,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    locations,
  },
} satisfies Meta<typeof BookmarkLocationsBox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleLocation: Story = {
  args: {
    locations: [locations[0]],
  },
};

export const Many: Story = {
  args: {
    locations: Array.from({
      length: 12,
    }, (_, index) => ({
      id: `loc-${index}`,
      name: `City ${index + 1}`,
      slug: `city-${index + 1}`,
      parentId: null,
      placeType: null,
    })),
  },
};
