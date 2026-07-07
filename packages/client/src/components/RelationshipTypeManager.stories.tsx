import type { RelationshipType } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { RelationshipTypesListing } from "./RelationshipTypeManager";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const relationshipTypes: RelationshipType[] = [
  {
    id: "rt-parent-child",
    name: "Parent / Child",
    slug: "parent-child",
    description: null,
    directional: true,
    builtIn: true,
    sortOrder: 0,
    createdAt: NOW,
    bookmarkCount: 42,
    relationshipCount: 38,
  },
  {
    id: "rt-related",
    name: "Related to",
    slug: "related-to",
    description: null,
    directional: false,
    builtIn: true,
    sortOrder: 1,
    createdAt: NOW,
    bookmarkCount: 18,
    relationshipCount: 12,
  },
  {
    id: "rt-sequel",
    name: "Sequel of",
    slug: "sequel-of",
    description: null,
    directional: true,
    builtIn: false,
    sortOrder: 2,
    createdAt: NOW,
    bookmarkCount: 0,
    relationshipCount: 0,
  },
];

const meta = {
  title: "Settings/RelationshipTypeManager",
  component: RelationshipTypesListing,
  parameters: {
    msw: {
      handlers: [
        ...apiHandlers,
        http.get("/api/relationship-types", () => HttpResponse.json(relationshipTypes)),
      ],
    },
  },
} satisfies Meta<typeof RelationshipTypesListing>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A populated relationship-type listing with built-in and custom types. */
export const Default: Story = {};
