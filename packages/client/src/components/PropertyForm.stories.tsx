import type { Category, MediaType, PropertyGroup } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { PropertyForm } from "./PropertyForm";
import { makeCategory, makeCustomProperty, makeMediaType } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const categories: Category[] = [
  makeCategory({
    id: "cat-articles",
    name: "Articles",
    slug: "articles",
  }),
  makeCategory({
    id: "cat-videos",
    name: "Videos",
    slug: "videos",
  }),
];

const mediaTypes: MediaType[] = [
  makeMediaType({
    id: "mt-book",
    name: "Book",
    slug: "book",
  }),
];

const propertyGroups: PropertyGroup[] = [
  {
    id: "group-reading",
    name: "Reading",
    slug: "reading",
    description: null,
    priority: 0,
    createdAt: NOW,
  },
];

const meta = {
  title: "Components/PropertyForm",
  component: PropertyForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    mode: "create",
    categories,
    mediaTypes,
    numberProperties: [],
    propertyGroups,
    onSubmit: () => {},
    submitLabel: "Create property",
    idPrefix: "story",
  },
} satisfies Meta<typeof PropertyForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The full create form, with an editable Type select. */
export const Create: Story = {};

/** Edit mode — Type is locked and the form is prefilled from the property. */
export const Edit: Story = {
  args: {
    mode: "edit",
    property: makeCustomProperty({
      id: "prop-priority",
      name: "Priority",
      slug: "priority",
      type: "number",
      numberMin: 1,
      numberMax: 5,
    }),
    submitLabel: "Save changes",
  },
};
