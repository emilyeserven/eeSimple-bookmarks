import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { HomepageSectionBlock } from "./HomepageSectionBlock";
import { makeHomepageSection } from "../test-utils/factories";
import { apiHandlers, sampleBookmark, sampleProperties } from "../test-utils/story-mocks";

const section = makeHomepageSection({
  id: "section-recent",
  title: "Recently added",
  description: "The latest links you've saved.",
  columns: 2,
});

const meta = {
  title: "Components/HomepageSectionBlock",
  component: HomepageSectionBlock,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/card-display", () => HttpResponse.json({
          sections: [],
          imageCorners: {
            "top-left": [],
            "top-right": [],
            "bottom-left": [],
            "bottom-right": [],
          },
          imageMode: "natural",
          imageVisibility: "shown",
          imageLayout: "above",
          hideWebsiteForYouTube: false,
        })),
        ...apiHandlers,
      ],
    },
  },
  args: {
    data: {
      section,
      bookmarks: [sampleBookmark],
    },
    customProperties: sampleProperties,
  },
} satisfies Meta<typeof HomepageSectionBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A populated cards section. */
export const Default: Story = {};

/** A section in table view. */
export const TableView: Story = {
  args: {
    data: {
      section: {
        ...section,
        viewMode: "table",
      },
      bookmarks: [sampleBookmark],
    },
    customProperties: sampleProperties,
  },
};

/** A section whose filter matches nothing. */
export const Empty: Story = {
  args: {
    data: {
      section,
      bookmarks: [],
    },
    customProperties: sampleProperties,
  },
};
