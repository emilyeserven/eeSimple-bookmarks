import type { RelationshipType } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { RelationshipTypesListing } from "./RelationshipTypeManager";
import { makeRelationshipType } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const relationshipTypes: RelationshipType[] = [
  makeRelationshipType({
    id: "rt-parent-child",
    name: "Parent / Child",
    slug: "parent-child",
    directional: true,
    builtIn: true,
    bookmarkCount: 42,
    relationshipCount: 38,
  }),
  makeRelationshipType({
    id: "rt-related",
    name: "Related to",
    slug: "related-to",
    builtIn: true,
    sortOrder: 1,
    bookmarkCount: 18,
    relationshipCount: 12,
  }),
  makeRelationshipType({
    id: "rt-sequel",
    name: "Sequel of",
    slug: "sequel-of",
    directional: true,
    sortOrder: 2,
    bookmarkCount: 0,
    relationshipCount: 0,
  }),
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
