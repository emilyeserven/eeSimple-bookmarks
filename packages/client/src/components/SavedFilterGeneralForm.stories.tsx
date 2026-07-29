import type { SavedFilter } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { SavedFilterGeneralForm } from "./SavedFilterGeneralForm";
import { makeSavedFilter } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const filter: SavedFilter = makeSavedFilter({
  id: "filter-tech-videos",
  name: "Tech Videos",
  slug: "tech-videos",
  description: "YouTube videos tagged dev, unread.",
  filters: {
    mediaTypes: ["media-video"],
  },
  viewableOnline: true,
});

const meta = {
  title: "Components/SavedFilterGeneralForm",
  component: SavedFilterGeneralForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    filter,
  },
} satisfies Meta<typeof SavedFilterGeneralForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Name, description, and sidebar-shortcut flag — each field auto-saves. */
export const Default: Story = {};

/** A filter with no description and not surfaced as a sidebar shortcut. */
export const Minimal: Story = {
  args: {
    filter: {
      ...filter,
      description: null,
      viewableOnline: false,
    },
  },
};
