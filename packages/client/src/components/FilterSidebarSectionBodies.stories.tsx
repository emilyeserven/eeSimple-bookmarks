import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  CategoryFilterBody,
  MediaTypeFilterBody,
  SectionsFilterBody,
  TagsFilterBody,
  YouTubeChannelFilterBody,
} from "./FilterSidebarSectionBodies";
import {
  apiHandlers,
  sampleCategories,
  sampleChannels,
  sampleMediaTypes,
  sampleTagTree,
} from "../test-utils/story-mocks";

const meta = {
  title: "Filters/FilterSidebarSectionBodies",
  component: CategoryFilterBody,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    categories: sampleCategories,
    search: {},
    onSearchChange: () => {},
  },
} satisfies Meta<typeof CategoryFilterBody>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Multi-select category filter body. */
export const Category: Story = {};

/** Tiered-tag filter body: a multi-select tree combobox plus Reset. */
export const Tags: StoryObj<typeof TagsFilterBody> = {
  render: args => <TagsFilterBody {...args} />,
  args: {
    tree: sampleTagTree,
    search: {},
    onSearchChange: () => {},
  },
};

/** Media-type filter body with expandable parent groups. */
export const MediaType: StoryObj<typeof MediaTypeFilterBody> = {
  render: args => <MediaTypeFilterBody {...args} />,
  args: {
    mediaTypes: sampleMediaTypes,
    search: {},
    onSearchChange: () => {},
  },
};

/** YouTube-channel filter body with avatars. */
export const YouTubeChannel: StoryObj<typeof YouTubeChannelFilterBody> = {
  render: args => <YouTubeChannelFilterBody {...args} />,
  args: {
    youtubeChannels: sampleChannels,
    search: {},
    onSearchChange: () => {},
  },
};

/** Section-type checkbox list body. */
export const Sections: StoryObj<typeof SectionsFilterBody> = {
  render: args => <SectionsFilterBody {...args} />,
  args: {
    search: {},
    onSearchChange: () => {},
  },
};
