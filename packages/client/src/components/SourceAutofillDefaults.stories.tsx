import type { YouTubeChannelCategory } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { http, HttpResponse } from "msw";

import { SourceAutofillDefaults } from "./SourceAutofillDefaults";
import { apiHandlers, sampleCategories, sampleMediaTypes, sampleTagTree } from "../test-utils/story-mocks";

const flatTags = sampleTagTree.flatMap(root => [root, ...root.children]);

const category: YouTubeChannelCategory = {
  id: sampleCategories[1].id,
  name: sampleCategories[1].name,
  slug: sampleCategories[1].slug,
  icon: sampleCategories[1].icon,
};

const handlers = [
  ...apiHandlers,
  http.get("/api/tags", () => HttpResponse.json(flatTags)),
];

const meta = {
  title: "Components/SourceAutofillDefaults",
  component: SourceAutofillDefaults,
  parameters: {
    msw: {
      handlers,
    },
  },
  args: {
    kind: "website",
    category,
    mediaTypeId: sampleMediaTypes[1].id,
    tagIds: [flatTags[0].id],
  },
} satisfies Meta<typeof SourceAutofillDefaults>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A website with a default category, media type, and tag. */
export const Website: Story = {};

/** A YouTube channel — the wording becomes "this channel". */
export const Channel: Story = {
  args: {
    kind: "channel",
    mediaTypeId: null,
    tagIds: [flatTags[1].id],
  },
};

/** A newsletter with only a default category. */
export const NewsletterCategoryOnly: Story = {
  args: {
    kind: "newsletter",
    mediaTypeId: null,
    tagIds: [],
  },
};
