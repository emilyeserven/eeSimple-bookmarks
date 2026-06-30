import type { SavedFilter } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { SavedFiltersManager } from "./SavedFiltersManager";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const filters: SavedFilter[] = [
  {
    id: "filter-tech-videos",
    name: "Tech Videos",
    slug: "tech-videos",
    description: "YouTube videos tagged dev, unread.",
    filters: {
      mediaTypes: ["media-video"],
    },
    viewableOnline: true,
    createdAt: NOW,
  },
  {
    id: "filter-to-read",
    name: "To Read",
    slug: "to-read",
    description: null,
    filters: {
      tags: ["tag-cli"],
    },
    viewableOnline: false,
    createdAt: NOW,
  },
];

const meta = {
  title: "Components/SavedFiltersManager",
  component: SavedFiltersManager,
  parameters: {
    msw: {
      handlers: [
        http.get("/api/saved-filters", () => HttpResponse.json(filters)),
        ...apiHandlers,
      ],
    },
  },
} satisfies Meta<typeof SavedFiltersManager>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A list of saved filters with delete + "viewable online" controls. */
export const Default: Story = {};

/** Empty state — no saved filters yet. */
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/saved-filters", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
};
