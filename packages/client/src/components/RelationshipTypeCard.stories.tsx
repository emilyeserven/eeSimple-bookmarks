import type { Meta, StoryObj } from "@storybook/react-vite";

import { RelationshipTypeCard } from "./RelationshipTypeCard";
import { makeRelationshipType } from "../test-utils/factories";

const baseType = makeRelationshipType({
  id: "rt-parent-child",
  name: "Parent / Child",
  slug: "parent-child",
  directional: true,
  builtIn: true,
  bookmarkCount: 42,
  relationshipCount: 38,
});

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
