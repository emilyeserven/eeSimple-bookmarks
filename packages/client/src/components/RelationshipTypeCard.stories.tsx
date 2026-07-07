import type { RelationshipType } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { RelationshipTypeCard } from "./RelationshipTypeCard";

const baseType: RelationshipType = {
  id: "rt-parent-child",
  name: "Parent / Child",
  slug: "parent-child",
  description: null,
  directional: true,
  builtIn: true,
  hidden: false,
  sortOrder: 0,
  createdAt: "2026-06-01T00:00:00.000Z",
  bookmarkCount: 42,
  relationshipCount: 38,
};

const meta = {
  title: "Components/RelationshipTypeCard",
  component: RelationshipTypeCard,
  args: {
    relationshipType: baseType,
  },
} satisfies Meta<typeof RelationshipTypeCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A built-in, directional type with a Built-in badge. */
export const BuiltInDirectional: Story = {};

/** A custom symmetric type with no bookmarks yet. */
export const CustomSymmetric: Story = {
  args: {
    relationshipType: {
      ...baseType,
      id: "rt-sequel",
      name: "Sequel of",
      slug: "sequel-of",
      directional: false,
      builtIn: false,
      bookmarkCount: 0,
      relationshipCount: 0,
    },
  },
};
