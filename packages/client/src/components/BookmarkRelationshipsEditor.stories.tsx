import type { BookmarkRelationship } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { BookmarkRelationshipsEditor } from "./BookmarkRelationshipsEditor";
import { apiHandlers, sampleBookmark } from "../test-utils/story-mocks";

const relationshipTypes = [
  {
    id: "rel-similar",
    name: "Similar",
    slug: "similar",
    directional: false,
    builtIn: true,
    sortOrder: 0,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  {
    id: "rel-sequel",
    name: "Sequel",
    slug: "sequel",
    directional: true,
    builtIn: false,
    sortOrder: 1,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
];

const handlers = [
  ...apiHandlers,
  http.get("/api/relationship-types", () => HttpResponse.json(relationshipTypes)),
  http.get("/api/bookmarks", () => HttpResponse.json([sampleBookmark])),
];

const initialRelationships: BookmarkRelationship[] = [
  {
    bookmark: {
      id: "bookmark-github",
      url: "https://github.com",
      title: "GitHub",
    },
    relationshipTypeId: "rel-similar",
    relationshipTypeName: "Similar",
    directional: false,
    role: "related",
    label: "same topic",
  },
];

const meta = {
  title: "Bookmarks/BookmarkRelationshipsEditor",
  component: BookmarkRelationshipsEditor,
  parameters: {
    msw: {
      handlers,
    },
  },
  args: {
    bookmarkId: "bm-relationships",
    initialRelationships: [],
    onDone: () => {},
  },
} satisfies Meta<typeof BookmarkRelationshipsEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithExistingRelationship: Story = {
  args: {
    initialRelationships,
  },
};
