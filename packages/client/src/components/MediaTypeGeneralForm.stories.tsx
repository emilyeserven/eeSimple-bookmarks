import type { MediaType } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { MediaTypeGeneralForm } from "./MediaTypeGeneralForm";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const mediaType = {
  id: "media-podcast",
  name: "Podcast",
  romanizedName: null,
  slug: "podcast",
  icon: "Mic",
  builtIn: false,
  sortOrder: 3,
  parentId: null,
  createdAt: NOW,
} satisfies MediaType;

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
    mediaType: {
      ...mediaType,
      id: "media-video",
      name: "Video",
      slug: "video",
      icon: null,
      builtIn: true,
      sortOrder: 0,
    } satisfies MediaType,
  },
};
