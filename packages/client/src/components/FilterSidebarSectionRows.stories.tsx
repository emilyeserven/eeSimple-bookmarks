import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  CategoryFilterSection,
  MediaTypeFilterSection,
  PropertiesFilterSection,
  SectionsFilterSection,
  TagsFilterSection,
  YouTubeChannelFilterSection,
} from "./FilterSidebarSectionRows";
import {
  apiHandlers,
  sampleBookmark,
  sampleCategories,
  sampleChannels,
  sampleMediaTypes,
  sampleProperties,
  sampleTagTree,
} from "../test-utils/story-mocks";

const meta = {
  title: "Filters/FilterSidebarSectionRows",
  component: CategoryFilterSection,
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
} satisfies Meta<typeof CategoryFilterSection>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Multi-select category filter accordion. */
export const Category: Story = {};

/** Tiered-tag filter with a presence toggle and tree combobox. */
export const Tags: StoryObj<typeof TagsFilterSection> = {
  render: args => <TagsFilterSection {...args} />,
  args: {
    tree: sampleTagTree,
    search: {},
    onSearchChange: () => {},
  },
};

/** Media-type filter with expandable parent groups. */
export const MediaType: StoryObj<typeof MediaTypeFilterSection> = {
  render: args => <MediaTypeFilterSection {...args} />,
  args: {
    mediaTypes: sampleMediaTypes,
    search: {},
    onSearchChange: () => {},
  },
};

/** YouTube-channel filter with avatars and a presence toggle. */
export const YouTubeChannel: StoryObj<typeof YouTubeChannelFilterSection> = {
  render: args => <YouTubeChannelFilterSection {...args} />,
  args: {
    youtubeChannels: sampleChannels,
    search: {},
    onSearchChange: () => {},
  },
};

/** Sections presence toggle plus section-type checkboxes. */
export const Sections: StoryObj<typeof SectionsFilterSection> = {
  render: args => <SectionsFilterSection {...args} />,
  args: {
    search: {},
    onSearchChange: () => {},
  },
};

/** Custom-property filters for the bookmark search sidebar. */
export const Properties: StoryObj<typeof PropertiesFilterSection> = {
  render: args => <PropertiesFilterSection {...args} />,
  args: {
    enabledProperties: sampleProperties,
    categories: sampleCategories,
    bookmarks: [sampleBookmark],
    search: {},
    onSearchChange: () => {},
  },
};
