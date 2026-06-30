import type { Meta, StoryObj } from "@storybook/react-vite";

import { FiltersPanel } from "./FiltersPanel";
import { validateBookmarkSearch } from "../../lib/bookmarkSearch";
import { useUiStore } from "../../stores/uiStore";
import {
  apiHandlers,
  sampleBookmark,
  sampleCategories,
  sampleMediaTypes,
  sampleProperties,
  sampleTagTree,
} from "../../test-utils/story-mocks";

const meta = {
  title: "Components/Panel/FiltersPanel",
  component: FiltersPanel,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof FiltersPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** No listing page is active — the panel shows a guidance message. */
export const NoListingPage: Story = {
  decorators: [
    (Story) => {
      useUiStore.setState({
        filterContext: null,
      });
      return <Story />;
    },
  ],
};

/** A listing page registered live filter context — the filter sections render. */
export const WithFilters: Story = {
  decorators: [
    (Story) => {
      useUiStore.setState({
        filterContext: {
          tree: sampleTagTree,
          properties: sampleProperties,
          categories: sampleCategories,
          mediaTypes: sampleMediaTypes,
          bookmarks: [sampleBookmark],
          search: validateBookmarkSearch({}),
          onSearchChange: () => {},
        },
      });
      return <Story />;
    },
  ],
};
