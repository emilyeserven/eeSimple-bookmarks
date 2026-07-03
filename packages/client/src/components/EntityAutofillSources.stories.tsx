import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { EntityAutofillSources } from "./EntityAutofillSources";
import { makeWebsite, makeYouTubeChannel } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const website = makeWebsite({
  id: "site-github",
  domain: "github.com",
  siteName: "GitHub",
  slug: "github",
  category: {
    id: "cat-workflow",
    name: "Workflow",
    slug: "workflow",
    icon: null,
  },
  mediaTypeId: "media-article",
  tagIds: ["tag-dev"],
});

const channel = makeYouTubeChannel({
  id: "channel-fireship",
  channelKey: "@fireship",
  name: "Fireship",
  slug: "fireship",
  category: {
    id: "cat-workflow",
    name: "Workflow",
    slug: "workflow",
    icon: null,
  },
  tagIds: ["tag-dev"],
});

const matchingHandlers = [
  ...apiHandlers,
  http.get("/api/websites", () => HttpResponse.json([website])),
  http.get("/api/youtube-channels", () => HttpResponse.json([channel])),
];

const meta = {
  title: "Components/EntityAutofillSources",
  component: EntityAutofillSources,
  parameters: {
    msw: {
      handlers: matchingHandlers,
    },
  },
} satisfies Meta<typeof EntityAutofillSources>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A category whose websites and channels autofill it onto new bookmarks. */
export const Category: Story = {
  args: {
    match: {
      kind: "category",
      categoryId: "cat-workflow",
    },
  },
};

/** A media type matched by the sources' default `mediaTypeId`. */
export const MediaType: Story = {
  args: {
    match: {
      kind: "media-type",
      mediaTypeId: "media-article",
    },
  },
};

/** A tag matched by the sources' default tag ids. */
export const Tag: Story = {
  args: {
    match: {
      kind: "tag",
      tagId: "tag-dev",
    },
  },
};
