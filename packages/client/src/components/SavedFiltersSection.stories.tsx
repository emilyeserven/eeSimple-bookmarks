import type { SavedFilter } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { SavedFiltersSection } from "./SavedFiltersSection";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const savedFilters: SavedFilter[] = [
  {
    id: "filter-tech-videos",
    name: "Tech Videos",
    slug: "tech-videos",
    description: "YouTube videos tagged dev.",
    filters: {
      mediaTypes: ["media-video"],
    },
    viewableOnline: true,
    createdAt: NOW,
  },
];

const meta = {
  title: "Components/SavedFiltersSection",
  component: SavedFiltersSection,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/saved-filters", () => HttpResponse.json(savedFilters)),
        ...apiHandlers,
      ],
    },
  },
  args: {
    search: {
      tags: ["tag-cli"],
    },
    onSearchChange: () => {},
  },
} satisfies Meta<typeof SavedFiltersSection>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Active filters applied — Clear Filters is enabled and the saved-filters dropdown is available. */
export const Default: Story = {};

/** The applied filters match a saved filter, so the dropdown trigger reflects its name. */
export const MatchesSavedFilter: Story = {
  args: {
    search: {
      mediaTypes: ["media-video"],
    },
  },
};
