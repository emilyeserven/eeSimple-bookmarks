import type { Category, MediaType } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  CategoryCheckboxList,
  MediaTypeCheckboxList,
  OperandCheckboxList,
} from "./PropertyFormFields";
import { makeCategory, makeCustomProperty } from "../test-utils/factories";

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
  makeCategory({
    id: "cat-books",
    name: "Books",
    slug: "books",
  }),
];

const mediaTypes: MediaType[] = [
  {
    id: "mt-book",
    name: "Book",
    slug: "book",
    parentId: null,
    builtIn: false,
    icon: null,
    sortOrder: 0,
    createdAt: NOW,
  },
  {
    id: "mt-ebook",
    name: "E-book",
    slug: "e-book",
    parentId: "mt-book",
    builtIn: false,
    icon: null,
    sortOrder: 1,
    createdAt: NOW,
  },
];

const meta = {
  title: "Components/CategoryCheckboxList",
  component: CategoryCheckboxList,
  args: {
    categories,
    selectedIds: ["cat-articles"],
    onToggle: () => {},
    idPrefix: "story",
  },
} satisfies Meta<typeof CategoryCheckboxList>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A checkbox list assigning a property to one or many categories. */
export const Default: Story = {};

/** With a leading "Select all" checkbox (applies to all current and future categories). */
export const WithSelectAll: Story = {
  args: {
    onToggleAll: () => {},
    allCategories: true,
  },
};

/** The media-type variant — children indented beneath their parent. */
export const MediaTypes: Story = {
  render: () => (
    <MediaTypeCheckboxList
      mediaTypes={mediaTypes}
      selectedIds={["mt-book"]}
      onToggle={() => {}}
      idPrefix="story-mt"
      onToggleAll={() => {}}
    />
  ),
};

/** The Calculate-operand variant — choose the Number properties to sum. */
export const Operands: Story = {
  render: () => (
    <OperandCheckboxList
      numberProperties={[
        makeCustomProperty({
          id: "prop-pages",
          name: "Pages",
        }),
        makeCustomProperty({
          id: "prop-minutes",
          name: "Minutes",
        }),
      ]}
      selectedIds={["prop-pages"]}
      onToggle={() => {}}
    />
  ),
};
