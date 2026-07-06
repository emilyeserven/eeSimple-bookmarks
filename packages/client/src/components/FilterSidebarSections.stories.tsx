import type { Meta, StoryObj } from "@storybook/react-vite";

import { FilterSections } from "./FilterSidebarSections";
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
  title: "Filters/FilterSections",
  component: FilterSections,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    tree: sampleTagTree,
    enabledProperties: sampleProperties,
    categories: sampleCategories,
    mediaTypes: sampleMediaTypes,
    youtubeChannels: sampleChannels,
    bookmarks: [sampleBookmark],
    search: {},
    onSearchChange: () => {},
    hasTags: true,
    hasProperties: true,
    hasSectionsFilter: true,
    hasCategoryFilter: true,
    hasMediaTypeFilter: true,
    hasChannelFilter: true,
    hasWebsiteFilter: false,
    hasRelationshipTypeFilter: false,
    hasPersonFilter: false,
    hasPlaceTypeFilter: false,
    hasGenreMoodFilter: false,
    hasMediaSourceFilter: false,
  },
} satisfies Meta<typeof FilterSections>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Tags, Category, Media type, Channel, Sections, and Properties sections with separators. */
export const Default: Story = {};

/** A `sectionFilter` keystroke narrows the visible sections to matching labels. */
export const Filtered: Story = {
  args: {
    sectionFilter: "tag",
  },
};

/** Only the Tags and Properties facets are available. */
export const Minimal: Story = {
  args: {
    hasCategoryFilter: false,
    hasMediaTypeFilter: false,
    hasChannelFilter: false,
    hasSectionsFilter: false,
  },
};
