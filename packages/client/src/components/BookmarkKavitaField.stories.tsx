import type { ConnectorsStatus, KavitaSeriesResult } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { BookmarkKavitaField } from "./BookmarkKavitaField";
import { makeBookmark } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const connectorsStatus: ConnectorsStatus = {
  hostedMetadata: {
    enabled: false,
    provider: null,
    baseUrl: null,
  },
  youtubeDataApi: {
    enabled: false,
  },
  instagram: {
    apiKey: false,
  },
  instagramReelArchive: {
    enabled: false,
  },
  objectStorage: {
    configured: false,
  },
  archiveBox: {
    enabled: false,
    baseUrl: null,
  },
  kavita: {
    enabled: true,
    baseUrl: "http://localhost:5000",
  },
  plex: {
    enabled: false,
    baseUrl: null,
    machineIdentifier: null,
  },
  geocoding: {
    enabled: true,
    endpoint: "https://nominatim.openstreetmap.org",
  },
  wikidata: {
    enabled: true,
    endpoint: "https://www.wikidata.org",
  },
};

const seriesResults: KavitaSeriesResult[] = [
  {
    seriesId: 12,
    libraryId: 3,
    name: "Berserk",
    libraryName: "Manga",
    releaseYear: 1989,
  },
  {
    seriesId: 44,
    libraryId: 1,
    name: "Dune",
    libraryName: "Books",
    releaseYear: 1965,
  },
];

const handlers = [
  http.get("/api/connectors", () => HttpResponse.json(connectorsStatus)),
  http.get("/api/kavita/series", () => HttpResponse.json(seriesResults)),
  ...apiHandlers,
];

const meta = {
  title: "Bookmarks/BookmarkKavitaField",
  component: BookmarkKavitaField,
  args: {
    onSelect: () => {},
  },
  parameters: {
    msw: {
      handlers,
    },
  },
} satisfies Meta<typeof BookmarkKavitaField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Unlinked bookmark — type at least two characters to search the Kavita library. */
export const Unlinked: Story = {
  args: {
    bookmark: makeBookmark(),
  },
};

/** Bookmark linked to a series — shows the deep link and the unlink button. */
export const Linked: Story = {
  args: {
    bookmark: makeBookmark({
      kavitaSeriesId: 12,
      kavitaLibraryId: 3,
      kavitaSeriesName: "Berserk",
    }),
  },
};
