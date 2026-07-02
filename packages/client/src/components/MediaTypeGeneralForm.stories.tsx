import type { Meta, StoryObj } from "@storybook/react-vite";

import { MediaTypeGeneralForm } from "./MediaTypeGeneralForm";
import { makeMediaType } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const mediaType = makeMediaType({
  id: "media-podcast",
  name: "Podcast",
  slug: "podcast",
  icon: "Mic",
  sortOrder: 3,
});

const meta = {
  title: "Components/MediaTypeGeneralForm",
  component: MediaTypeGeneralForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    mediaType,
  },
} satisfies Meta<typeof MediaTypeGeneralForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A built-in media type: the name and sort-order fields are locked. */
export const BuiltIn: Story = {
  args: {
    mediaType: makeMediaType({
      id: "media-video",
      name: "Video",
      slug: "video",
      builtIn: true,
    }),
  },
};
