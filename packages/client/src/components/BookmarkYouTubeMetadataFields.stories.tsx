import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkYouTubeMetadataFields } from "./BookmarkYouTubeMetadataFields";
import { useFetchMetadata } from "../hooks/useFetchMetadata";
import { makeBookmark, makeCustomProperty } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const bookmark = makeBookmark({
  id: "bm-yt",
  url: "https://www.youtube.com/watch?v=abc123",
  title: "An interesting video",
  mediaType: {
    id: "media-video",
    name: "Video",
    slug: "video",
    icon: null,
    parentId: null,
    builtIn: false,
  },
});

const runtimeProp = makeCustomProperty({
  id: "prop-runtime",
  name: "Runtime",
  slug: "runtime",
  type: "number",
  builtIn: true,
});

const datePostedProp = makeCustomProperty({
  id: "prop-date-posted",
  name: "Date Posted",
  slug: "date-posted",
  type: "datetime",
  builtIn: true,
});

const meta = {
  title: "Bookmarks/BookmarkYouTubeMetadataFields",
  component: BookmarkYouTubeMetadataFields,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof BookmarkYouTubeMetadataFields>;

export default meta;

/** Both built-in fields present, each with its fetch-from-YouTube button. */
export const Default: StoryObj = {
  render: () => {
    const fetchMetadata = useFetchMetadata();
    return (
      <BookmarkYouTubeMetadataFields
        bookmark={bookmark}
        fetchMetadata={fetchMetadata}
        runtimeProp={runtimeProp}
        datePostedProp={datePostedProp}
        numberInputs={{
          "prop-runtime": "612",
        }}
        dateTimeInputs={{
          "prop-date-posted": "2026-05-20",
        }}
        onNumberChange={() => {}}
        onDateTimeChange={() => {}}
      />
    );
  },
};

/** Only the Runtime field applies. */
export const RuntimeOnly: StoryObj = {
  render: () => {
    const fetchMetadata = useFetchMetadata();
    return (
      <BookmarkYouTubeMetadataFields
        bookmark={bookmark}
        fetchMetadata={fetchMetadata}
        runtimeProp={runtimeProp}
        numberInputs={{}}
        dateTimeInputs={{}}
        onNumberChange={() => {}}
        onDateTimeChange={() => {}}
      />
    );
  },
};
