import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { FilterPillsRow } from "./FilterPillsRow";
import {
  apiHandlers,
  sampleBookmark,
  sampleCategories,
  sampleChannels,
  sampleMediaTypes,
  sampleProperties,
  sampleTagTree,
} from "../test-utils/story-mocks";

const meta = {
  title: "Filters/FilterPillsRow",
  component: FilterPillsRow,
  parameters: {
    msw: {
      handlers: [
        // Self-fetched by the language-usage pill and the saved-filters section; empty by default
        // so the AllEmpty story shows only the standard-facet pills plus "Add filter".
        http.get("/api/languages", () => HttpResponse.json([])),
        http.get("/api/language-usage-levels", () => HttpResponse.json([])),
        http.get("/api/saved-filters", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
  args: {
    tree: sampleTagTree,
    properties: sampleProperties,
    categories: sampleCategories,
    mediaTypes: sampleMediaTypes,
    youtubeChannels: sampleChannels,
    bookmarks: [sampleBookmark],
    search: {},
    onSearchChange: () => {},
  },
} satisfies Meta<typeof FilterPillsRow>;

export default meta;

type Story = StoryObj<typeof meta>;

/** All pills empty — each shows just the facet name in subtle text. */
export const AllEmpty: Story = {};

/** With active selections — the Category and Tags pills fill and show a summary. */
export const WithSelection: Story = {
  args: {
    search: {
      categories: ["cat-workflow", "cat-content"],
      tagPresence: "missing",
    },
  },
};

/**
 * Full parity: custom-property pills (one per enabled property), the language-usage pill, and a
 * saved filter all present alongside the standard facet pills.
 */
export const FullParity: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/languages", () => HttpResponse.json([
          {
            id: "lang-en",
            name: "English",
            isoCode: "en",
            slug: "english",
            builtIn: true,
            sortOrder: 0,
            isFavorite: false,
            createdAt: "2026-06-01T00:00:00.000Z",
          },
        ])),
        http.get("/api/language-usage-levels", () => HttpResponse.json([
          {
            id: "level-dub",
            name: "Dub",
            slug: "dub",
            kind: "availability",
            builtIn: true,
            sortOrder: 0,
            createdAt: "2026-06-01T00:00:00.000Z",
            usageCount: 1,
          },
        ])),
        http.get("/api/saved-filters", () => HttpResponse.json([
          {
            id: "filter-tech-videos",
            name: "Tech Videos",
            slug: "tech-videos",
            description: "YouTube videos tagged dev.",
            filters: {
              mediaTypes: ["media-video"],
            },
            viewableOnline: true,
            createdAt: "2026-06-01T00:00:00.000Z",
          },
        ])),
        ...apiHandlers,
      ],
    },
  },
  args: {
    search: {
      num: {
        "prop-priority": [4, 8],
      },
      languageUsageLanguages: ["lang-en"],
    },
  },
};
